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
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 lg:px-16 py-4 md:py-6 lg:py-8 bg-gradient-to-b from-background via-background/95 to-transparent">
      {/* Logo */}
      <div className="flex items-center gap-3">
        <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold tracking-tight text-foreground">
          ZICOTV
        </h1>
      </div>

      {/* Navigation Tabs */}
      <nav className="hidden md:flex items-center gap-2 lg:gap-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => onTabChange(tab.id)}
            className={cn(
              'px-3 py-2 lg:px-6 lg:py-3 text-sm lg:text-xl font-semibold rounded-lg transition-all duration-200',
              'outline-none border-2 cursor-pointer',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'bg-secondary/50 text-muted-foreground border-transparent hover:bg-secondary hover:text-foreground',
            )}
          >
            {tab.label}
          </button>
        ))}
      </nav>

      {/* Mobile Menu */}
      <select 
        className="md:hidden bg-secondary/50 text-foreground px-3 py-2 rounded-lg border border-border"
        value={activeTab}
        onChange={(e) => onTabChange(e.target.value)}
      >
        {TABS.map((tab) => (
          <option key={tab.id} value={tab.id}>{tab.label}</option>
        ))}
      </select>

      {/* Live Indicator */}
      <div className="flex items-center gap-2 lg:gap-4 px-3 py-2 lg:px-6 lg:py-3 rounded-full bg-primary/20 border-2 border-primary/40">
        <span className="relative flex h-3 w-3 lg:h-4 lg:w-4">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
          <span className="relative inline-flex rounded-full h-3 w-3 lg:h-4 lg:w-4 bg-primary"></span>
        </span>
        <span className="text-sm lg:text-xl font-bold text-foreground">{liveCount} en vivo</span>
      </div>
    </header>
  )
}
