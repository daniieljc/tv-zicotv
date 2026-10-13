'use client'

import { useEffect } from 'react'
import { startPresence } from '@/lib/presence'

/** Arranca el heartbeat de uso en cualquier pantalla (va en el layout). */
export function Presence() {
  useEffect(() => {
    startPresence()
  }, [])
  return null
}
