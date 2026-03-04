'use client'

import { cn } from '@/lib/utils'

interface HeaderProps {
  activeTab: string
  onTabChange: (tab: string) => void
  liveCount: number
}

const TABS = [
  { id: 'all', label: 'EN VIVO' },
  { id: 'FÚTBOL', label: 'FUTBOL' },
  { id: 'BASKET', label: 'BASKET' },
  { id: 'TENIS', label: 'TENIS' },
  { id: 'MOTOR', label: 'MOTOR' },
  { id: 'UFC', label: 'UFC' },
]

export function TVHeader({ activeTab, onTabChange, liveCount }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-16 py-8 bg-gradient-to-b from-background via-background/95 to-transparent">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground">
          ZICOTV
        </h1>
      </div>

      {/* Navigation Tabs */}
      <nav className="flex items-center gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-6 py-3 text-xl font-semibold rounded-lg transition-all duration-200',
              'outline-none border-2',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Live Indicator */}
      <div className="flex items-center gap-4 px-6 py-3 rounded-full bg-primary/20 border-2 border-primary/40">
        <span className="relative flex h-4 w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
        </span>
        <span className="text-xl font-bold text-foreground">{liveCount} en vivo</span>
      </div>
    </header>
  )
}
