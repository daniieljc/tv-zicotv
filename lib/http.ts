// Acceso a la API con timeout y cambio automático de dominio.
//
// - Timeout: en la TV una petición colgada dejaría "Cargando…" para siempre
//   (AbortSignal.timeout no existe en los WebView antiguos de Android TV).
// - Dominios: los operadores bloquean dominios (zicotv.cc ya lo está). Si el
//   dominio en uso no conecta, se prueba el siguiente y se recuerda el que
//   funciona. La lista llega del servidor (/app/version → api_domains) y se
//   guarda, así un dominio nuevo se aprende sin publicar otra versión.

const FORCED = process.env.NEXT_PUBLIC_API_URL || '' // solo desarrollo: p. ej. http://localhost:8768/api/v1
const KEY_DOMAINS = 'zico_api_domains'
const KEY_PREFERRED = 'zico_api_domain'
const DEFAULT_DOMAINS = ['bp.zicotv.cc', 'zicotv.cc']

function read(key: string): string | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage.getItem(key) : null
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value)
  } catch {
    /* almacenamiento no disponible */
  }
}

function domains(): string[] {
  let stored: string[] = []
  try {
    const v = JSON.parse(read(KEY_DOMAINS) || '[]')
    if (Array.isArray(v)) stored = v.filter((d) => typeof d === 'string' && d)
  } catch {
    /* lista corrupta: se ignora */
  }
  return [...new Set([read(KEY_PREFERRED), ...stored, ...DEFAULT_DOMAINS].filter(Boolean) as string[])]
}

/** Guarda la lista de dominios que publica el servidor. */
export function rememberApiDomains(list: unknown): void {
  if (Array.isArray(list) && list.length) write(KEY_DOMAINS, JSON.stringify(list.filter((d) => typeof d === 'string' && d)))
}

/** Dominio web en uso (para mostrar "bp.zicotv.cc/activate" en pantalla). */
export function webHost(): string {
  return FORCED ? new URL(FORCED).host : domains()[0]
}

/**
 * fetch a un path bajo /api ("/v1/events", "/streams/…") con timeout y cambio de
 * dominio si no hay conexión. Una respuesta HTTP (también 4xx/5xx) no cambia de
 * dominio: el servidor sí respondió.
 */
export async function apiFetch(path: string, init: RequestInit = {}, ms = 15000): Promise<Response> {
  const bases = FORCED ? [FORCED.replace(/\/v1\/?$/, '')] : domains().map((d) => `https://${d}/api`)
  let lastErr: unknown = new Error('Sin conexión')
  for (const base of bases) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), ms)
    try {
      const res = await fetch(base + path, { ...init, signal: controller.signal })
      if (!FORCED) write(KEY_PREFERRED, new URL(base).host)
      return res
    } catch (err) {
      lastErr = err
    } finally {
      clearTimeout(timer)
    }
  }
  throw lastErr
}
