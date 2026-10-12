'use client'

import { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Navegación por mando (D-pad): cada elemento enfocable se registra con una
// posición (fila, columna) y las flechas mueven el foco por esa rejilla.
//
// Dos contextos a propósito: las ACCIONES (registrar, enfocar) son estables y
// el ID ENFOCADO cambia con cada pulsación. Antes iban juntos: cada cambio de
// foco creaba un contexto nuevo, la limpieza de useFocusable des-registraba
// todos los elementos y, tras el primer movimiento, ya no quedaba nada al que
// moverse.

interface FocusableElement {
  id: string
  node: HTMLElement
  row: number
  col: number
  /** Ref al último onEnterPress (cambia en cada render del componente). */
  onSelect: { current: (() => void) | undefined }
}

interface NavigationActions {
  register: (element: FocusableElement) => void
  unregister: (id: string, node: HTMLElement) => void
  setFocusedId: (id: string) => void
}

const ActionsContext = createContext<NavigationActions | null>(null)
const FocusedContext = createContext<string | null>(null)

// Último elemento enfocado por pantalla: al volver de un partido el foco vuelve
// a la tarjeta desde la que se entró, no al principio de la página.
const STORAGE_PREFIX = 'tvnav-focus:'

function rememberFocus(id: string) {
  try {
    sessionStorage.setItem(STORAGE_PREFIX + window.location.pathname, id)
  } catch {
    /* almacenamiento no disponible */
  }
}

function recalledFocus(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_PREFIX + window.location.pathname)
  } catch {
    return null
  }
}

function scrollToElement(el: FocusableElement) {
  // Filas de arriba (cabecera / hero): al principio de la página. El resto,
  // centradas en vertical (la cabecera fija taparía una fila pegada arriba).
  if (el.row <= 0) {
    window.scrollTo({ top: 0, behavior: 'smooth' })
    // Scroll horizontal solo dentro de su contenedor (pestañas): un
    // scrollIntoView aquí cancelaría el scroll suave de la ventana.
    const box = el.node.parentElement
    if (box && box.scrollWidth > box.clientWidth) {
      box.scrollTo({ left: el.node.offsetLeft - box.clientWidth / 2 + el.node.clientWidth / 2, behavior: 'smooth' })
    }
  } else {
    el.node.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'center' })
  }
}

export function TVNavigationProvider({ children, initialFocusKey }: { children: ReactNode; initialFocusKey?: string }) {
  const router = useRouter()
  const elementsRef = useRef<Map<string, FocusableElement>>(new Map())
  const [focusedId, setFocusedIdState] = useState<string | null>(null)
  const focusedRef = useRef<string | null>(null)

  const setFocusedId = useCallback((id: string) => {
    focusedRef.current = id
    setFocusedIdState(id)
    rememberFocus(id)
    const element = elementsRef.current.get(id)
    if (element) scrollToElement(element)
  }, [])

  const actions = useMemo<NavigationActions>(
    () => ({
      register: (element) => {
        elementsRef.current.set(element.id, element)
      },
      unregister: (id, node) => {
        // Solo si sigue siendo ESE nodo (otro pudo registrarse con el mismo id).
        if (elementsRef.current.get(id)?.node === node) elementsRef.current.delete(id)
      },
      setFocusedId,
    }),
    [setFocusedId],
  )

  // Global reference for setFocus
  useEffect(() => {
    globalSetFocus = setFocusedId
    return () => {
      globalSetFocus = null
    }
  }, [setFocusedId])

  // Foco inicial: el recordado de esta pantalla si sigue existiendo; si no, el indicado.
  useEffect(() => {
    const timer = setTimeout(() => {
      const recalled = recalledFocus()
      const target = recalled && elementsRef.current.has(recalled) ? recalled : initialFocusKey
      if (target) {
        focusedRef.current = target
        setFocusedIdState(target)
        const el = elementsRef.current.get(target)
        if (el && el.row > 0) scrollToElement(el)
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [initialFocusKey])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ya la ha usado un componente (p. ej. el reproductor cambiando de fuente,
      // que escucha en captura): no la procesamos dos veces.
      if (e.defaultPrevented) return
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      const elements = Array.from(elementsRef.current.values())
      if (elements.length === 0) return

      const currentElement = focusedRef.current ? elementsRef.current.get(focusedRef.current) : undefined
      // El enfocado desapareció (cambio de pestaña, refresco de datos): se
      // recupera el foco en el primer elemento de contenido.
      if (!currentElement && e.key.startsWith('Arrow')) {
        e.preventDefault()
        const fallback =
          elements.filter((el) => el.row >= 0).sort((a, b) => a.row - b.row || a.col - b.col)[0] ?? elements[0]
        setFocusedId(fallback.id)
        return
      }
      const currentRow = currentElement?.row ?? 0
      const currentCol = currentElement?.col ?? 0

      let nextElement: FocusableElement | undefined
      const nearestInRow = (row: number) =>
        elements
          .filter((el) => el.row === row)
          .sort((a, b) => Math.abs(a.col - currentCol) - Math.abs(b.col - currentCol))[0]

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          nextElement = elements
            .filter((el) => el.row === currentRow && el.col > currentCol)
            .sort((a, b) => a.col - b.col)[0]
          break
        case 'ArrowLeft':
          e.preventDefault()
          nextElement = elements
            .filter((el) => el.row === currentRow && el.col < currentCol)
            .sort((a, b) => b.col - a.col)[0]
          break
        case 'ArrowDown': {
          e.preventDefault()
          const rows = elements.filter((el) => el.row > currentRow).map((el) => el.row)
          if (rows.length) nextElement = nearestInRow(Math.min(...rows))
          break
        }
        case 'ArrowUp': {
          e.preventDefault()
          const rows = elements.filter((el) => el.row < currentRow).map((el) => el.row)
          if (rows.length) nextElement = nearestInRow(Math.max(...rows))
          break
        }
        case 'Enter':
          if (currentElement?.onSelect.current) {
            e.preventDefault()
            currentElement.onSelect.current()
          }
          return
        case 'Escape':
        case 'Backspace':
          e.preventDefault()
          router.back()
          return
      }

      if (nextElement) setFocusedId(nextElement.id)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [router, setFocusedId])

  return (
    <ActionsContext.Provider value={actions}>
      <FocusedContext.Provider value={focusedId}>{children}</FocusedContext.Provider>
    </ActionsContext.Provider>
  )
}

// Global setFocus function - for imperatively setting focus
let globalSetFocus: ((id: string) => void) | null = null

export function setFocus(id: string) {
  if (globalSetFocus) {
    globalSetFocus(id)
  }
}

/** Id del elemento enfocado ahora mismo (null fuera de un TVNavigationProvider). */
export function useFocusedId(): string | null {
  return useContext(FocusedContext)
}

// Hook for focusable elements
export function useFocusable({
  focusKey,
  row = 0,
  col = 0,
  onEnterPress,
}: {
  focusKey: string
  row?: number
  col?: number
  onEnterPress?: () => void
}) {
  const actions = useContext(ActionsContext)
  const focusedId = useContext(FocusedContext)
  const onSelect = useRef(onEnterPress)
  onSelect.current = onEnterPress
  const nodeRef = useRef<HTMLElement | null>(null)

  // Registro estable: solo cambia si cambian el id o la posición.
  const setRef = useCallback(
    (node: HTMLElement | null) => {
      if (!actions) return
      if (nodeRef.current && nodeRef.current !== node) actions.unregister(focusKey, nodeRef.current)
      nodeRef.current = node
      if (node) actions.register({ id: focusKey, node, row, col, onSelect })
    },
    [actions, focusKey, row, col],
  )

  return { ref: setRef, focused: focusedId === focusKey }
}
