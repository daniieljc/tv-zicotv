'use client'

import { createContext, useContext, useCallback, useEffect, useRef, useState, ReactNode } from 'react'
import { useRouter } from 'next/navigation'

// Types
interface FocusableElement {
  id: string
  ref: HTMLElement | null
  row: number
  col: number
  onSelect?: () => void
}

interface NavigationContextType {
  register: (element: FocusableElement) => void
  unregister: (id: string) => void
  focusedId: string | null
  setFocusedId: (id: string) => void
}

const NavigationContext = createContext<NavigationContextType | null>(null)

// Provider Component
export function TVNavigationProvider({ 
  children, 
  initialFocusKey 
}: { 
  children: ReactNode
  initialFocusKey?: string 
}) {
  const router = useRouter()
  const elementsRef = useRef<Map<string, FocusableElement>>(new Map())
  const [focusedId, setFocusedIdState] = useState<string | null>(null)

  const register = useCallback((element: FocusableElement) => {
    elementsRef.current.set(element.id, element)
  }, [])

  const unregister = useCallback((id: string) => {
    elementsRef.current.delete(id)
  }, [])

  const setFocusedId = useCallback((id: string) => {
    setFocusedIdState(id)
    const element = elementsRef.current.get(id)
    if (element?.ref) {
      element.ref.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' })
    }
  }, [])

  // Set global reference for setFocus
  useEffect(() => {
    globalSetFocus = setFocusedId
    return () => {
      globalSetFocus = null
    }
  }, [setFocusedId])

  // Initialize focus
  useEffect(() => {
    if (initialFocusKey) {
      const timer = setTimeout(() => {
        setFocusedIdState(initialFocusKey)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [initialFocusKey])

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const elements = Array.from(elementsRef.current.values())
      if (elements.length === 0) return

      const currentElement = focusedId ? elementsRef.current.get(focusedId) : null
      const currentRow = currentElement?.row ?? 0
      const currentCol = currentElement?.col ?? 0

      let nextElement: FocusableElement | undefined

      switch (e.key) {
        case 'ArrowRight':
          e.preventDefault()
          nextElement = elements
            .filter(el => el.row === currentRow && el.col > currentCol)
            .sort((a, b) => a.col - b.col)[0]
          // If no element to right, try wrapping or stay
          if (!nextElement) {
            nextElement = elements
              .filter(el => el.row === currentRow)
              .sort((a, b) => a.col - b.col)[0]
          }
          break
        case 'ArrowLeft':
          e.preventDefault()
          nextElement = elements
            .filter(el => el.row === currentRow && el.col < currentCol)
            .sort((a, b) => b.col - a.col)[0]
          if (!nextElement) {
            nextElement = elements
              .filter(el => el.row === currentRow)
              .sort((a, b) => b.col - a.col)[0]
          }
          break
        case 'ArrowDown':
          e.preventDefault()
          nextElement = elements
            .filter(el => el.row > currentRow)
            .sort((a, b) => {
              const rowDiff = a.row - b.row
              if (rowDiff !== 0) return rowDiff
              return Math.abs(a.col - currentCol) - Math.abs(b.col - currentCol)
            })[0]
          break
        case 'ArrowUp':
          e.preventDefault()
          nextElement = elements
            .filter(el => el.row < currentRow)
            .sort((a, b) => {
              const rowDiff = b.row - a.row
              if (rowDiff !== 0) return rowDiff
              return Math.abs(a.col - currentCol) - Math.abs(b.col - currentCol)
            })[0]
          break
        case 'Enter':
          e.preventDefault()
          if (currentElement?.onSelect) {
            currentElement.onSelect()
          }
          return
        case 'Escape':
        case 'Backspace':
          if (!(e.target instanceof HTMLInputElement)) {
            e.preventDefault()
            router.back()
          }
          return
      }

      if (nextElement) {
        setFocusedId(nextElement.id)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [focusedId, router, setFocusedId])

  return (
    <NavigationContext.Provider value={{ register, unregister, focusedId, setFocusedId }}>
      {children}
    </NavigationContext.Provider>
  )
}

// Global setFocus function - for imperatively setting focus
let globalSetFocus: ((id: string) => void) | null = null

export function setFocus(id: string) {
  if (globalSetFocus) {
    globalSetFocus(id)
  }
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
  const context = useContext(NavigationContext)
  const ref = useRef<HTMLElement | null>(null)

  const setRef = useCallback((node: HTMLElement | null) => {
    ref.current = node
    if (context && node) {
      context.register({
        id: focusKey,
        ref: node,
        row,
        col,
        onSelect: onEnterPress,
      })
    }
  }, [context, focusKey, row, col, onEnterPress])

  useEffect(() => {
    return () => {
      if (context) {
        context.unregister(focusKey)
      }
    }
  }, [context, focusKey])

  const focused = context?.focusedId === focusKey

  return { ref: setRef, focused }
}
