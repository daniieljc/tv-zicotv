'use client'

import { cn } from '@/lib/utils'
import { useFocusable } from '@/hooks/use-tv-navigation'

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  liveCount: number
  sports: string[]
}

export function TVHeader({ activeTab, onTabChange, liveCount, sports }: HeaderProps) {
  // Las pestañas se construyen con los deportes REALES que devuelve la API
  // (available_sports), no con una lista fija. Así "Soccer", "Baseball", etc.
  // coinciden con las claves de events_by_sport y el filtro funciona de verdad.
  const tabs = [{ id: 'all', label: 'EN VIVO' }, ...sports.map((s) => ({ id: s, label: s.toUpperCase() }))]

  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center gap-4 px-4 md:px-8 lg:px-16 py-4 md:py-6 lg:py-8 bg-gradient-to-b from-background via-background/95 to-transparent">
      {/* Logo */}
      <h1 className="flex-shrink-0 text-2xl md:text-3xl lg:text-5xl font-extrabold tracking-tight text-foreground">
        ZICOTV
      </h1>

      {/* Navigation Tabs (deportes reales, con scroll horizontal si hay muchos) */}
      <nav className="hidden md:flex flex-1 items-center gap-2 lg:gap-3 overflow-x-auto scrollbar-hide">
        {tabs.map((tab, i) => (
          <HeaderTab key={tab.id} label={tab.label} index={i} active={activeTab === tab.id} onSelect={() => onTabChange(tab.id)} />
        ))}
      </nav>

      {/* Mobile Menu */}
      <select
        className="md:hidden ml-auto bg-secondary/50 text-foreground px-3 py-2 rounded-lg border border-border"
        value={activeTab}
        onChange={(e) => onTabChange(e.target.value)}
      >
        {tabs.map((tab) => (
          <option key={tab.id} value={tab.id}>{tab.label}</option>
        ))}
      </select>

      {/* Live Indicator */}
      <div className="flex flex-shrink-0 items-center gap-2 lg:gap-4 px-3 py-2 lg:px-6 lg:py-3 rounded-full bg-primary/20 border-2 border-primary/40">
        <span className="relative flex h-3 w-3 lg:h-4 lg:w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 lg:h-4 lg:w-4 bg-primary"></span>
        </span>
        <span className="text-sm lg:text-xl font-bold text-foreground whitespace-nowrap">{liveCount} en vivo</span>
      </div>
    </header>
  )
}

// Pestaña enfocable con el mando: fila -1 (encima del hero). OK la selecciona.
function HeaderTab({ label, index, active, onSelect }: { label: string; index: number; active: boolean; onSelect: () => void }) {
  const { ref, focused } = useFocusable({ focusKey: `tab-${index}`, row: -1, col: index, onEnterPress: onSelect })

  return (
    <button
      ref={ref}
      onClick={onSelect}
      className={cn(
        'flex-shrink-0 px-3 py-2 lg:px-6 lg:py-3 text-sm lg:text-xl font-semibold rounded-lg transition-all duration-200',
        'outline-none border-2 cursor-pointer whitespace-nowrap',
        active
          ? 'bg-primary text-primary-foreground border-primary'
          : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground',
        focused && 'scale-105 border-white shadow-[0_0_24px_rgba(255,255,255,0.35)]',
      )}
    >
      {label}
    </button>
  )
}
