'use client'

import { useEffect, useState } from 'react'
import { checkForUpdate, type UpdateState } from '@/lib/version'

const DISMISS_KEY = 'zico_update_dismissed'

// Aviso de nueva versión. En la TV normalmente no hay navegador, así que en vez
// de un enlace mostramos la dirección corta para teclearla en Downloader.
// Opcional: banner que se cierra con OK/Atrás. Obligatoria (por debajo de
// min_version_code): pantalla que bloquea la app.
export function UpdatePrompt() {
  const [state, setState] = useState<UpdateState>({ kind: 'none' })

  useEffect(() => {
    checkForUpdate().then((s) => {
      try {
        if (s.kind === 'optional' && localStorage.getItem(DISMISS_KEY) === String(s.info.latest_version_code)) return
      } catch {
        /* almacenamiento no disponible */
      }
      setState(s)
    })
  }, [])

  useEffect(() => {
    if (state.kind !== 'optional') return
    const code = state.info.latest_version_code
    const dismiss = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' && e.key !== 'Escape' && e.key !== 'Backspace') return
      e.preventDefault()
      e.stopImmediatePropagation()
      try {
        localStorage.setItem(DISMISS_KEY, String(code))
      } catch {
        /* almacenamiento no disponible */
      }
      setState({ kind: 'none' })
    }
    // En captura: el aviso se cierra antes de que la navegación de la página procese la tecla.
    window.addEventListener('keydown', dismiss, true)
    return () => window.removeEventListener('keydown', dismiss, true)
  }, [state])

  if (state.kind === 'none') return null
  const { info } = state

  if (state.kind === 'required') {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background px-10 text-center">
        <span className="mb-6 text-7xl">⬇️</span>
        <h1 className="mb-4 text-4xl font-black lg:text-5xl">Actualización necesaria</h1>
        <p className="mb-8 max-w-2xl text-xl text-muted-foreground lg:text-2xl">
          Esta versión de Zico TV ya no funciona. Instala la versión {info.latest_version_name} encima de esta (no pierdes tu activación).
        </p>
        <div className="rounded-2xl border-2 border-primary bg-primary/10 px-10 py-6">
          <p className="mb-2 text-base uppercase tracking-[0.2em] text-muted-foreground">Escribe en Downloader</p>
          <p className="text-4xl font-black tracking-wide text-foreground lg:text-5xl">{info.download_short}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-8 left-1/2 z-[100] flex -translate-x-1/2 items-center gap-6 rounded-2xl border-2 border-primary/60 bg-black/90 px-8 py-5 shadow-2xl backdrop-blur">
      <span className="text-4xl">⬇️</span>
      <div>
        <p className="text-2xl font-bold text-white">Nueva versión {info.latest_version_name} disponible</p>
        <p className="text-lg text-muted-foreground">
          Descárgala en Downloader: <span className="font-bold text-white">{info.download_short}</span>
        </p>
      </div>
      <span className="rounded-lg bg-white/10 px-3 py-1.5 text-base text-white/70">OK para cerrar</span>
    </div>
  )
}
