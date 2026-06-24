import type { EventsResponse, EventDetailResponse, Event, SportData, FallbackSource, Stream, OwnStream } from './types'
import auth from './auth'

// API pública oficial v1. Devuelve los eventos en plano y, en el detalle, las
// fuentes ya resueltas: la propia como página del PLAYER (iframe que firma el
// stream por dentro, sin el 403 del .m3u8 crudo) y las externas con sus streams.
const API_V1 = process.env.NEXT_PUBLIC_API_URL || 'https://zicotv.cc/api/v1'

// (Opcional) token de cliente de entorno; alternativa al código.
const API_TOKEN = process.env.NEXT_PUBLIC_ZICOTV_API_TOKEN || ''

// Añade acceso SIN anuncios a la URL del player: primero el CÓDIGO de activación
// guardado (flujo principal del gate), y si no hubiera, el token de entorno.
function withAccess(url: string): string {
  const sep = url.includes('?') ? '&' : '?'
  const code = auth.getCode()
  if (code) return url + sep + 'code=' + encodeURIComponent(code)
  if (API_TOKEN) return url + sep + 'token=' + encodeURIComponent(API_TOKEN)
  return url
}

// ───────── Shapes crudos de v1 ─────────
interface V1Stream {
  stream_no: number
  url: string
  hd?: boolean
  language?: string
  heat_tier?: string
}
interface V1Source {
  source: string
  name?: string
  id?: string | null
  type: string
  url: string
  hd?: boolean
  language?: string
  viewers?: number
  streams?: V1Stream[]
}
interface V1Match {
  id: number
  title: string
  home_team: string | null
  away_team: string | null
  home_team_badge: string | null
  away_team_badge: string | null
  sport_category: string
  league: string
  venue: string | null
  start_time: string
  status: string
  has_stream: boolean
  thumbnail_url?: string | null
  sources?: V1Source[]
}
interface V1EventsResponse {
  date: string
  total: number
  live: number
  data: V1Match[]
}

function ownViewers(m: V1Match): number {
  const own = (m.sources ?? []).find((s) => s.source === 'own')
  return own?.viewers ?? 0
}

function toEvent(m: V1Match): Event {
  return {
    id: m.id,
    title: m.title,
    league: m.league,
    start_time: m.start_time,
    status: m.status === 'live' ? 'live' : 'scheduled',
    sport_category: m.sport_category,
    home_team: m.home_team,
    away_team: m.away_team,
    home_team_badge: m.home_team_badge,
    away_team_badge: m.away_team_badge,
    venue: m.venue,
    thumbnail_url: m.thumbnail_url ?? null,
    has_stream: m.has_stream,
    viewers: ownViewers(m),
  }
}

// Puntuación de "lo más visto": espectadores reales primero; a igualdad, los
// que están EN VIVO y con stream pesan por delante de los programados.
export function eventScore(e: Event): number {
  return (e.viewers ?? 0) * 1000 + (e.status === 'live' ? 100 : 0) + (e.has_stream ? 1 : 0)
}

// Lista: v1 plano → agrupado por deporte → liga (lo que espera la UI de TV).
export async function fetchEvents(): Promise<EventsResponse> {
  const res = await fetch(`${API_V1}/events`)
  if (!res.ok) throw new Error('Failed to fetch events')

  const payload: V1EventsResponse = await res.json()
  const matches = payload.data ?? []

  const bySport: Record<string, SportData> = {}
  for (const m of matches) {
    const sport = m.sport_category || 'Otros'
    const league = m.league || sport
    if (!bySport[sport]) bySport[sport] = { total_events: 0, leagues_count: 0, leagues: {} }
    const sd = bySport[sport]
    if (!sd.leagues[league]) sd.leagues[league] = []
    sd.leagues[league].push(toEvent(m))
    sd.total_events++
  }
  // Dentro de cada liga: los más vistos primero.
  for (const sd of Object.values(bySport)) {
    sd.leagues_count = Object.keys(sd.leagues).length
    for (const league of Object.keys(sd.leagues)) {
      sd.leagues[league].sort((a, b) => eventScore(b) - eventScore(a))
    }
  }

  // Deportes ordenados por "calor" (suma de puntuación de sus eventos): los que
  // tienen los eventos más vistos salen primero.
  const sportHeat = (sd: SportData): number =>
    Object.values(sd.leagues).flat().reduce((acc, e) => acc + eventScore(e), 0)
  const available_sports = Object.keys(bySport).sort((a, b) => sportHeat(bySport[b]) - sportHeat(bySport[a]))
  const events_by_sport: Record<string, SportData> = {}
  for (const s of available_sports) events_by_sport[s] = bySport[s]

  return {
    success: true,
    events_by_sport,
    total_events: payload.total ?? matches.length,
    live_events: payload.live ?? matches.filter((m) => m.status === 'live').length,
    available_sports,
  }
}

// Detalle: v1 sources → own_stream (página del player, iframe) + fallback con streams.
export async function fetchEvent(id: number): Promise<EventDetailResponse> {
  const res = await fetch(`${API_V1}/events/${id}`)
  if (!res.ok) throw new Error('Failed to fetch event')

  const m: V1Match = (await res.json()).data
  const sources = m.sources ?? []

  // Canal propio → su URL es la PÁGINA del player (iframe), no el .m3u8.
  const own = sources.find((s) => s.source === 'own')
  const own_stream: OwnStream | null = own
    ? { name: own.name || 'Oficial', type: 'iframe', output_path: withAccess(own.url), is_streaming: true }
    : null

  // Resto de fuentes (externas + manuales) con sus streams ya resueltos por v1.
  // Si una fuente no trae streams, usamos su propia URL de embed como único stream.
  const fallback_sources: FallbackSource[] = sources
    .filter((s) => s.source !== 'own')
    .map((s, i) => {
      const streams: Stream[] =
        s.streams && s.streams.length
          ? s.streams.map((st) => ({
              embedUrl: st.url,
              hd: !!st.hd,
              language: st.language || '',
              viewers: 0,
            }))
          : [{ embedUrl: s.url, hd: !!s.hd, language: s.language || '', viewers: 0 }]
      return { id: s.id ?? `${s.source}-${i}`, source: s.source, streams }
    })

  return { success: true, event: toEvent(m), own_stream, fallback_sources }
}
