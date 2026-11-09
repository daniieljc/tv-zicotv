'use client'

import { memo, useState, useEffect } from 'react'
import { useFocusable } from '@/hooks/use-tv-navigation'
import { cn } from '@/lib/utils'
import type { Event } from '@/lib/types'
import { useRouter } from 'next/navigation'

/**
 * La API ya da las imágenes de thesportsdb reducidas a las apps (escudo 200 px,
 * miniatura 888 px); en la tarjeta el escudo se pinta a 40 px: basta /tiny (100 px).
 * Directas, sin el proxy wsrv.nl: para pintar un <img> no hace falta CORS.
 */
function cardBadge(url: string): string {
  return /^https:\/\/r2\.thesportsdb\.com\/.+\/small$/.test(url) ? url.replace(/\/small$/, '/tiny') : url
}

// Fuera de EventCard: definido dentro, cada repintado de la tarjeta lo trataba
// como un componente nuevo y volvía a montar (y decodificar) los escudos.
function TeamBadge({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false)
  return (
    <div className="relative w-6 h-6 lg:w-10 lg:h-10 flex-shrink-0">
      {src && !error ? (
        <img
          src={cardBadge(src)}
          alt={alt}
          className="w-full h-full object-contain"
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setError(true)}
        />
      ) : (
        <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
          <span className="text-xs lg:text-sm font-bold text-white">{alt.charAt(0)}</span>
        </div>
      )}
    </div>
  )
}

interface EventCardProps {
  event: Event
  focusKey: string
  row: number
  col: number
}

function EventCardInner({ event, focusKey, row, col }: EventCardProps) {
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const [formattedTime, setFormattedTime] = useState<string>('')

  const handleSelect = () => {
    router.push(`/watch/?id=${event.id}`)
  }

  const { ref, focused } = useFocusable({
    focusKey,
    row,
    col,
    onEnterPress: handleSelect,
  })

  // Format time on client side only to avoid hydration mismatch
  useEffect(() => {
    if (event.start_time) {
      const time = new Date(event.start_time).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
      setFormattedTime(time)
    }
  }, [event.start_time])

  return (
      <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
              'relative flex-shrink-0 w-[280px] md:w-[320px] lg:w-[420px] rounded-xl lg:rounded-2xl overflow-hidden cursor-pointer',
              // Ligero para la gráfica de un box de TV: solo se anima transform (sin
              // sombras difuminadas grandes ni transparencia en todas las demás).
              'transition-transform duration-150 ease-out outline-none',
              'border-2 lg:border-4 border-transparent',
              focused && 'scale-105 z-20 border-primary'
          )}
          tabIndex={-1}
          onClick={handleSelect}
      >
        {/* Thumbnail Container */}
        <div className="relative aspect-video bg-secondary">
          {event.thumbnail_url && !imgError ? (
              <img
                  src={event.thumbnail_url}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  loading="lazy"
                  decoding="async"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
              />
          ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <span className="text-8xl opacity-20">
              {event.sport_category === 'FUTBOL' ? '\u26BD' : '\uD83C\uDFC6'}
            </span>
              </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Live Badge */}
          {event.status === 'live' && (
              <div className="absolute top-3 left-3 lg:top-5 lg:left-5 flex items-center gap-2 lg:gap-3 px-2 py-1 lg:px-4 lg:py-2 bg-primary rounded-lg z-10">
            <span className="relative flex h-2 w-2 lg:h-3 lg:w-3">
              <span className="relative inline-flex rounded-full h-2 w-2 lg:h-3 lg:w-3 bg-white"></span>
            </span>
                <span className="text-xs lg:text-base font-extrabold text-white uppercase tracking-widest">Live</span>
              </div>
          )}

          {/* Stream Available */}
          {event.has_stream && (
              <div className="absolute top-3 right-3 lg:top-5 lg:right-5 p-2 lg:p-3 bg-black/70 rounded-full z-10">
                <svg className="w-4 h-4 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
          )}

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 z-10">
            {event.home_team && event.away_team && event.home_team !== 'Unknown Team' ? (
                // Cada equipo ocupa su mitad y el nombre puede ir en 2 líneas: con
                // un ancho máximo fijo los nombres largos se cortaban con "…".
                <div className="flex items-center gap-2 mb-2 lg:mb-3">
                  <div className="flex min-w-0 flex-1 items-center gap-2 lg:gap-3">
                    <TeamBadge src={event.home_team_badge ?? undefined} alt={event.home_team ?? ''} />
                    <span className="line-clamp-2 min-w-0 break-words text-sm lg:text-lg font-semibold leading-tight text-white">
                      {event.home_team}
                    </span>
                  </div>
                  <span className="shrink-0 text-sm lg:text-lg font-extrabold text-primary">VS</span>
                  <div className="flex min-w-0 flex-1 items-center justify-end gap-2 lg:gap-3">
                    <span className="line-clamp-2 min-w-0 break-words text-right text-sm lg:text-lg font-semibold leading-tight text-white">
                      {event.away_team}
                    </span>
                    <TeamBadge src={event.away_team_badge ?? undefined} alt={event.away_team ?? ''} />
                  </div>
                </div>
            ) : (
                <h3 className="text-sm lg:text-xl font-semibold text-white mb-2 lg:mb-3 line-clamp-2 break-words leading-tight">
                  {event.title}
                </h3>
            )}

            {/* Time / Status */}
            <div className="flex items-center justify-between gap-2 text-xs lg:text-base">
              <span className="font-bold tabular-nums text-white/80">
                {event.status === 'live' ? 'En directo' : event.status === 'finished' ? 'Finalizado' : event.status === 'cancelled' ? 'Cancelado' : event.status === 'postponed' ? 'Aplazado' : formattedTime || '--:--'}
              </span>
              {event.viewers && event.viewers > 0 ? (
                <span className="flex flex-shrink-0 items-center gap-1 font-bold tabular-nums text-primary">
                  <svg className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-7a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" />
                  </svg>
                  {event.viewers.toLocaleString('es-ES')}
                </span>
              ) : event.venue ? (
                <span className="max-w-[100px] truncate text-xs text-white/60 lg:max-w-[200px] lg:text-sm">
                  {event.venue}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
  )
}

// Al recargar la lista (cada minuto) los eventos llegan como objetos nuevos: solo
// se repinta la tarjeta si cambia algo de lo que muestra.
export const EventCard = memo(EventCardInner, (a, b) =>
  a.focusKey === b.focusKey && a.row === b.row && a.col === b.col
  && a.event.id === b.event.id && a.event.status === b.event.status && a.event.viewers === b.event.viewers
  && a.event.title === b.event.title && a.event.start_time === b.event.start_time
  && a.event.thumbnail_url === b.event.thumbnail_url && a.event.home_team_badge === b.event.home_team_badge
  && a.event.away_team_badge === b.event.away_team_badge && a.event.has_stream === b.event.has_stream
  && a.event.venue === b.event.venue && a.event.home_team === b.event.home_team && a.event.away_team === b.event.away_team,
)
