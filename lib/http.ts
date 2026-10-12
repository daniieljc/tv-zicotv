// fetch con timeout: en la TV una petición colgada dejaría "Cargando…" para
// siempre. (AbortSignal.timeout no existe en los WebView antiguos de Android TV.)
export async function fetchWithTimeout(url: string, init: RequestInit = {}, ms = 15000): Promise<Response> {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), ms)
  try {
    return await fetch(url, { ...init, signal: controller.signal })
  } finally {
    clearTimeout(timer)
  }
}

export const API_V1 = process.env.NEXT_PUBLIC_API_URL || 'https://zicotv.cc/api/v1'
/** Raíz de la API sin versión (p. ej. /api/streams). */
export const API_ROOT = API_V1.replace(/\/v1\/?$/, '')
