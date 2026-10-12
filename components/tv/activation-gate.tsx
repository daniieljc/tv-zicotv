'use client'

import { useState, useRef, useEffect } from 'react'
import { auth } from '@/lib/auth'
import { webHost } from '@/lib/http'
import { useAppVersion } from '@/lib/version'

interface ActivationGateProps {
  /** Mensaje al llegar aquí por una sesión cerrada (p. ej. Premium caducado). */
  notice?: string
}

// Pantalla de activación: es lo PRIMERO que ve el usuario. La app es exclusiva
// Premium: se activa con el código personal de zicotv.cc/activate y el
// reproductor va sin anuncios. auth.login() avisa a la página para entrar.
export function ActivationGate({ notice }: ActivationGateProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState<'validate' | null>(null)
  const [error, setError] = useState<string | null>(notice ?? null)
  const inputRef = useRef<HTMLInputElement>(null)
  const version = useAppVersion()

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const activate = async () => {
    const value = code.trim()
    if (value.length < 3) {
      setError('Introduce un código válido')
      return
    }
    setLoading('validate')
    setError(null)
    try {
      const res = await auth.validate(value)
      if (res.valid) {
        auth.login(value)
      } else {
        setError(res.message || 'Código incorrecto o expirado')
      }
    } catch {
      setError('No se pudo conectar. Revisa tu conexión.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center overflow-y-auto bg-background px-6 py-6">
      <div className="w-full max-w-xl text-center">
        {/* Marca */}
        <h1 className="mb-2 text-4xl font-black tracking-tighter lg:text-6xl">
          <span className="text-primary">ZICO</span>
          <span className="text-foreground">TV</span>
        </h1>
        <div className="mb-4 inline-block rounded-full bg-amber-500 px-4 py-1 text-sm font-black uppercase tracking-[0.2em] text-black lg:text-base">
          Exclusivo Premium
        </div>
        <p className="mb-6 text-lg text-muted-foreground lg:text-2xl">
          Introduce tu código Premium para empezar
        </p>

        {/* Input del código */}
        <input
          ref={inputRef}
          value={code}
          onChange={(e) => {
            setCode(e.target.value.toUpperCase())
            setError(null)
          }}
          onKeyDown={(e) => e.key === 'Enter' && activate()}
          placeholder="ZICO-XXXX-XXXX"
          autoCapitalize="characters"
          spellCheck={false}
          className="mb-4 w-full rounded-2xl border-2 border-border bg-secondary/40 px-6 py-4 text-center text-2xl font-bold uppercase tracking-[0.2em] text-foreground outline-none transition-colors placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:border-primary lg:text-3xl"
        />

        {/* Error */}
        {error && <p className="mb-4 text-lg font-medium text-primary">{error}</p>}

        {/* Activar */}
        <button
          onClick={activate}
          disabled={loading !== null}
          className="mb-6 w-full rounded-2xl bg-primary px-8 py-4 text-2xl font-bold text-primary-foreground outline-none transition-all focus:ring-4 focus:ring-white disabled:opacity-50 lg:text-3xl"
        >
          {loading === 'validate' ? 'Comprobando…' : 'Activar'}
        </button>

        {/* Dónde conseguir el código (en la TV no hay navegador: se indica la dirección) */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span className="text-base lg:text-lg">¿No tienes código?</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <p className="mt-4 text-lg leading-relaxed text-muted-foreground lg:text-xl">
          Desde el móvil o el ordenador entra en{' '}
          <span className="font-bold text-foreground">{webHost()}/activate</span> e inicia sesión con el correo
          y la contraseña de tu cuenta Premium. Allí verás tu código.
          <br />
          ¿Aún no eres Premium? Hazte en <span className="font-bold text-foreground">{webHost()}/premium</span>
        </p>
        <p className="mt-4 text-sm text-muted-foreground/60 lg:text-base">Zico TV {version}</p>
      </div>
    </div>
  )
}
