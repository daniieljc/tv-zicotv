// Gate de activación: al arrancar, la app pide un código. Con un código válido el
// reproductor va SIN anuncios (el backend lo reconoce por ?code= en /api/player).
// El estado se guarda en localStorage. Mismo flujo que app-zicotv.

const API_V1 = process.env.NEXT_PUBLIC_API_URL || 'https://zicotv.cc/api/v1'

const KEY_AUTH = 'isAuthenticated'
const KEY_CODE = 'accessCode'

export interface ValidateResponse {
  valid: boolean
  message?: string
  valid_until?: string | null
}

function store(): Storage | null {
  try {
    return typeof window !== 'undefined' ? window.localStorage : null
  } catch {
    return null
  }
}

export const auth = {
  isAuthenticated(): boolean {
    return store()?.getItem(KEY_AUTH) === 'true'
  },

  getCode(): string | null {
    return store()?.getItem(KEY_CODE) ?? null
  },

  /** Valida el código contra el backend. No persiste nada por sí solo. */
  async validate(code: string): Promise<ValidateResponse> {
    const res = await fetch(`${API_V1}/access-codes/validate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ code: code.trim() }),
    })
    if (!res.ok) throw new Error('No se pudo validar el código')
    return res.json()
  },

  /** Pide un código gratis al backend (autoservicio). */
  async generate(): Promise<string> {
    const res = await fetch(`${API_V1}/access-codes/generate`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    })
    if (!res.ok) throw new Error('No se pudo generar el código')
    const d = await res.json()
    return d.code as string
  },

  /** Guarda la sesión tras una validación correcta. */
  login(code: string): void {
    const s = store()
    s?.setItem(KEY_AUTH, 'true')
    s?.setItem(KEY_CODE, code.trim())
  },

  logout(): void {
    const s = store()
    s?.removeItem(KEY_AUTH)
    s?.removeItem(KEY_CODE)
  },
}

export default auth
