'use client'

import { useEffect, useState } from 'react'
import { checkForUpdate, type UpdateState } from '@/lib/version'

// Cerrada con OK en esta ejecución de la app. Vive en memoria a propósito: la
// home se vuelve a montar al salir de cada partido y no debe repetir la alerta,
// pero en el próximo arranque sí vuelve a salir mientras siga desactualizada.
let dismissedThisLaunch = false

// Alerta de versión desactualizada. En la TV normalmente no hay navegador, así
// que en vez de un botón de descarga mostramos la dirección corta para
// teclearla en Downloader.
// - Opcional: alerta en cada arranque; OK/Atrás la cierra hasta el siguiente.
// - Obligatoria (por debajo de min_version_code): pantalla que bloquea la app.
export function UpdatePrompt() {
  const [state, setState] = useState<UpdateState>({ kind: 'none' })

  // Al montar, al volver a primer plano y cada 30 min (antes solo al arrancar).
  useEffect(() => {
    const check = () =>
      checkForUpdate().then((s) => {
        if (s.kind === 'optional' && dismissedThisLaunch) return
        setState(s)
      })
    check()
    const interval = setInterval(check, 30 * 60 * 1000)
    const onVisible = () => {
      if (document.visibilityState === 'visible') check()
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      clearInterval(interval)
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [])

  // Con la alerta abierta, el mando solo habla con ella: las flechas no mueven
  // la página de detrás y OK/Atrás la cierran.
  useEffect(() => {
    if (state.kind !== 'optional') return
    const onKey = (e: KeyboardEvent) => {
      e.preventDefault()
      e.stopImmediatePropagation()
      if (e.key === 'Enter' || e.key === 'Escape' || e.key === 'Backspace') {
        dismissedThisLaunch = true
        setState({ kind: 'none' })
      }
    }
    // En captura: antes que la navegación de la página.
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [state])

  if (state.kind === 'none') return null
  const { info, current } = state
  const required = state.kind === 'required'

  return (
    <div
      role="alertdialog"
      aria-modal="true"
      className={
        required
          ? 'fixed inset-0 z-[100] flex items-center justify-center bg-background px-10'
          : 'fixed inset-0 z-[100] flex items-center justify-center bg-black/75 px-10 backdrop-blur-sm'
      }
    >
      <div
        className={
          required
            ? 'w-full max-w-3xl text-center'
            : 'w-full max-w-3xl rounded-3xl border-2 border-primary/50 bg-[#141414] px-12 py-10 text-center shadow-[0_30px_100px_rgba(0,0,0,0.7)]'
        }
      >
        <span className="mb-5 inline-flex h-20 w-20 items-center justify-center rounded-full bg-primary/15 text-5xl ring-2 ring-primary/40">
          {required ? '⬇️' : '✨'}
        </span>
        <h1 className="mb-3 text-4xl font-black lg:text-5xl">{required ? 'Actualización necesaria' : 'Hay una versión nueva'}</h1>
        <p className="mx-auto mb-7 max-w-2xl text-xl text-muted-foreground lg:text-2xl">
          {required
            ? 'Esta versión de Zico TV ya no funciona. Instala la nueva encima de esta: no pierdes tu activación.'
            : 'Actualiza para tener las últimas mejoras. Se instala encima y no pierdes tu activación.'}
        </p>

        <div className="mb-7 inline-flex items-center gap-5 rounded-2xl bg-white/5 px-7 py-3 text-xl lg:text-2xl">
          <span className="text-muted-foreground">
            Tienes <b className="text-foreground">v{current}</b>
          </span>
          <span className="text-muted-foreground/50">→</span>
          <span className="text-muted-foreground">
            Nueva <b className="text-primary">v{info.latest_version_name}</b>
          </span>
        </div>

        <div className="mx-auto max-w-xl rounded-2xl border-2 border-primary bg-primary/10 px-8 py-5">
          <p className="mb-1 text-base uppercase tracking-[0.2em] text-muted-foreground">Escríbelo en Downloader</p>
          <p className="text-4xl font-black tracking-wide text-foreground lg:text-5xl">{info.download_short}</p>
        </div>

        {!required && (
          <p className="mt-7 text-lg text-muted-foreground">
            Pulsa <kbd className="mx-1 rounded-md bg-white/10 px-3 py-1 font-bold text-foreground">OK</kbd> para seguir viendo
          </p>
        )}
      </div>
    </div>
  )
}
