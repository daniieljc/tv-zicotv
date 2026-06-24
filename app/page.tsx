'use client'

import { useEffect, useState } from 'react'
import { TVHome } from '@/components/tv/tv-home'
import { ActivationGate } from '@/components/tv/activation-gate'
import { fetchEvents } from '@/lib/api'
import { auth } from '@/lib/auth'
import type { EventsResponse } from '@/lib/types'

// IMPORTANTE: la app es un export estático dentro de Capacitor. Si los datos se
// pidieran en el servidor (build time) la parrilla quedaría CONGELADA con los
// eventos del momento de compilar el APK. Por eso pedimos en el cliente (runtime)
// y refrescamos cada minuto para mantener el directo al día.
export default function HomePage() {
  // null = aún comprobando activación (localStorage solo existe en cliente).
  const [authed, setAuthed] = useState<boolean | null>(null)
  const [data, setData] = useState<EventsResponse | null>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setAuthed(auth.isAuthenticated())
  }, [])

  useEffect(() => {
    if (!authed) return
    let alive = true
    const load = async () => {
      try {
        const d = await fetchEvents()
        if (alive) {
          setData(d)
          setFailed(false)
        }
      } catch {
        if (alive) setFailed(true)
      }
    }
    load()
    const iv = setInterval(load, 60_000)
    return () => {
      alive = false
      clearInterval(iv)
    }
  }, [authed])

  // Mientras comprobamos la activación (primer render) no parpadeamos el gate.
  if (authed === null) return <div className="min-h-screen bg-background" />

  // Lo PRIMERO: pedir el código si no está activado.
  if (!authed) return <ActivationGate onActivated={() => setAuthed(true)} />

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-6 text-center">
        {failed ? (
          <div className="flex flex-col items-center gap-4">
            <span className="text-6xl">📡</span>
            <p className="text-3xl font-bold text-foreground">No se pudo conectar</p>
            <p className="text-xl text-muted-foreground">Revisa tu conexión e inténtalo de nuevo</p>
            <button
              onClick={() => {
                setFailed(false)
                fetchEvents().then(setData).catch(() => setFailed(true))
              }}
              className="mt-4 rounded-2xl bg-primary px-10 py-4 text-2xl font-bold text-primary-foreground outline-none focus:ring-4 focus:ring-white"
            >
              Reintentar
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <div className="h-16 w-16 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <span className="text-2xl text-muted-foreground">Cargando eventos…</span>
          </div>
        )}
      </div>
    )
  }

  return <TVHome data={data} />
}
