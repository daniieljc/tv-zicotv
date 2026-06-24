'use client'

import { useState, useRef, useEffect } from 'react'
import { auth } from '@/lib/auth'

interface ActivationGateProps {
  onActivated: () => void
}

// Pantalla de activación: es lo PRIMERO que ve el usuario. Con un código válido la
// app queda activada (se guarda) y el reproductor va sin anuncios.
export function ActivationGate({ onActivated }: ActivationGateProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState<'validate' | 'generate' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [generated, setGenerated] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

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
        onActivated()
      } else {
        setError(res.message || 'Código incorrecto o expirado')
      }
    } catch {
      setError('No se pudo conectar. Revisa tu conexión.')
    } finally {
      setLoading(null)
    }
  }

  const generate = async () => {
    setLoading('generate')
    setError(null)
    try {
      const newCode = await auth.generate()
      setCode(newCode)
      setGenerated(newCode)
      inputRef.current?.focus()
    } catch {
      setError('No se pudo generar el código')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-6">
      <div className="w-full max-w-xl text-center">
        {/* Marca */}
        <h1 className="mb-3 text-5xl font-black tracking-tighter lg:text-7xl">
          <span className="text-primary">ZICO</span>
          <span className="text-foreground">TV</span>
        </h1>
        <p className="mb-10 text-lg text-muted-foreground lg:text-2xl">
          Introduce tu código de acceso para empezar
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
          placeholder="TU CÓDIGO"
          autoCapitalize="characters"
          spellCheck={false}
          className="mb-4 w-full rounded-2xl border-2 border-border bg-secondary/40 px-6 py-5 text-center text-2xl font-bold uppercase tracking-[0.2em] text-foreground outline-none transition-colors placeholder:tracking-normal placeholder:text-muted-foreground/50 focus:border-primary lg:text-3xl"
        />

        {/* Error */}
        {error && <p className="mb-4 text-lg font-medium text-primary">{error}</p>}

        {/* Activar */}
        <button
          onClick={activate}
          disabled={loading !== null}
          className="mb-6 w-full rounded-2xl bg-primary px-8 py-5 text-2xl font-bold text-primary-foreground outline-none transition-all focus:ring-4 focus:ring-white disabled:opacity-50 lg:text-3xl"
        >
          {loading === 'validate' ? 'Comprobando…' : 'Activar'}
        </button>

        {/* Autoservicio: generar código */}
        <div className="flex items-center gap-4 text-muted-foreground">
          <span className="h-px flex-1 bg-border" />
          <span className="text-base lg:text-lg">¿No tienes código?</span>
          <span className="h-px flex-1 bg-border" />
        </div>
        <button
          onClick={generate}
          disabled={loading !== null}
          className="mt-4 rounded-xl border-2 border-border bg-secondary/40 px-8 py-3 text-lg font-semibold text-foreground outline-none transition-all hover:bg-secondary focus:border-primary focus:ring-2 focus:ring-primary disabled:opacity-50 lg:text-xl"
        >
          {loading === 'generate' ? 'Generando…' : 'Generar código gratis'}
        </button>

        {generated && (
          <p className="mt-5 text-base text-muted-foreground lg:text-lg">
            Tu código: <span className="font-bold tracking-widest text-foreground">{generated}</span> — guárdalo y pulsa Activar
          </p>
        )}
      </div>
    </div>
  )
}
