// Gate de activación: la app es exclusiva Premium. Al arrancar pide el código
// personal del usuario (zicotv.cc/activar); con él el reproductor va SIN
// anuncios (el backend lo reconoce por ?code= en /api/player). Se revalida en
// cada arranque y al volver a primer plano: si el Premium caduca, se cierra la
// sesión. El estado se guarda en localStorage. Mismo flujo que app-zicotv.

import { API_V1, fetchWithTimeout } from './http'

const KEY_AUTH = 'isAuthenticated'
const KEY_CODE = 'accessCode'

export interface ValidateResponse {
  valid: boolean
  /** invalid | expired | free | not_premium */
  reason?: string | null
  message?: string
  valid_until?: string | null
}

type Listener = (authed: boolean, message?: string) => void
const listeners = new Set<Listener>()

function store(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export const auth = {
  isAuthenticated(): boolean {
    const s = store()
    return s?.getItem(KEY_AUTH) === 'true' && !!s?.getItem(KEY_CODE)
  },

  getCode(): string | null {
    return store()?.getItem(KEY_CODE) ?? null
  },

  /** Valida el código contra el backend. No persiste nada por sí solo. */
  async validate(code: string): Promise<ValidateResponse> {
    const res = await fetchWithTimeout(`${API_V1}/access-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code: code.trim().toUpperCase() }),
    })
    if (!res.ok) throw new Error('No se pudo validar el código')
    return res.json()
  },

  /** Guarda la sesión tras una validación correcta. */
  login(code: string): void {
    const s = store()
    s?.setItem(KEY_AUTH, 'true')
    s?.setItem(KEY_CODE, code.trim().toUpperCase())
    listeners.forEach((l) => l(true))
  },

  /** Cierra la sesión; `message` se muestra en la pantalla de activación. */
  logout(message?: string): void {
    const s = store()
    s?.removeItem(KEY_AUTH)
    s?.removeItem(KEY_CODE)
    listeners.forEach((l) => l(false, message))
  },

  /**
   * Revalida el código guardado. Si el servidor dice que ya no vale (Premium
   * caducado, código cambiado…) cierra la sesión. Sin conexión o con errores
   * del servidor no hace nada: no echamos a nadie por estar offline.
   */
  async revalidate(): Promise<void> {
    const code = auth.getCode()
    if (!code) return
    try {
      const res = await auth.validate(code)
      if (res && res.valid === false) auth.logout(res.message)
    } catch {
      /* offline */
    }
  },

  subscribe(listener: Listener): () => void {
    listeners.add(listener)
    return () => {
      listeners.delete(listener)
    }
  },
}

export default auth
