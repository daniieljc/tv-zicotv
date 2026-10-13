// Heartbeat de uso (Dashboard → Uso de la app): cada minuto y al volver a primer
// plano. Envía qué app es y el código activado para saber qué usuario está
// conectado. Silencioso: nunca molesta al usuario.

import { Capacitor } from '@capacitor/core'
import auth from './auth'
import { apiFetch } from './http'
import { APP_VERSION } from './version'

const DEVICE_KEY = 'zico_device_id'

function deviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_KEY)
    if (!id) {
      id =
        typeof crypto !== 'undefined' && 'randomUUID' in crypto
          ? crypto.randomUUID()
          : `tv_${Date.now()}_${Math.random().toString(36).slice(2, 12)}`
      localStorage.setItem(DEVICE_KEY, id)
    }
    return id
  } catch {
    return 'tv_sin_almacenamiento'
  }
}

async function ping(): Promise<void> {
  try {
    await apiFetch('/v1/app/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        device_id: deviceId(),
        platform: Capacitor.getPlatform(),
        app_version: APP_VERSION,
        activated: auth.isAuthenticated(),
        app: 'tv',
        code: auth.getCode(),
      }),
      keepalive: true,
    })
  } catch {
    /* silencioso */
  }
}

let started = false

export function startPresence(): void {
  if (started || typeof window === 'undefined') return
  started = true
  ping()
  setInterval(ping, 60_000)
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') ping()
  })
}
