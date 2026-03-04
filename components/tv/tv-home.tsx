'use client'

import { useState, useMemo } from 'react'
import { TVNavigationProvider } from '@/hooks/use-tv-navigation'
import { TVHeader } from './header'
import { TVHero } from './hero'
import { LeagueRow } from './league-row'
import type { EventsResponse, Event } from '@/lib/types'

interface TVHomeProps {
  data: EventsResponse
}

export function TVHome({ data }: TVHomeProps) {
  const [activeTab, setActiveTab] = useState('all')

  // Get hero event (first live event or first event)
  const heroEvent = useMemo(() => {
    const allEvents: Event[] = []
    Object.values(data.events_by_sport).forEach(sport => {
      Object.values(sport.leagues).forEach(events => {
        allEvents.push(...events)
      })
    })
    return allEvents.find(e => e.status === 'live') || allEvents[0]
  }, [data])

  // Filter sports based on active tab
  const filteredSports = useMemo(() => {
    if (activeTab === 'all') {
      return data.events_by_sport
    }
    const filtered: typeof data.events_by_sport = {}
    if (data.events_by_sport[activeTab]) {
      filtered[activeTab] = data.events_by_sport[activeTab]
    }
    return filtered
  }, [data.events_by_sport, activeTab])

  // Calculate row indices for navigation
  let rowIndex = 1 // Start at 1, row 0 is for hero

  return (
    <TVNavigationProvider initialFocusKey="hero-watch">
      <div className="min-h-screen bg-background">
        {/* Header */}
        <TVHeader 
          activeTab={activeTab}
          onTabChange={setActiveTab}
          liveCount={data.live_events}
        />

        {/* Main Content */}
        <main className="pt-16 md:pt-20 lg:pt-28">
          {/* Hero */}
          {heroEvent && <TVHero event={heroEvent} />}

          {/* Content Rows */}
          <div className="py-4 lg:py-10">
            {Object.entries(filteredSports).map(([sportName, sportData]) => (
              <div key={sportName} className="mb-6 lg:mb-14">
                {/* Sport Category Title */}
                <div className="px-4 md:px-8 lg:px-16 mb-4 lg:mb-8">
                  <h2 className="text-xl md:text-2xl lg:text-4xl font-black text-foreground flex items-center gap-2 lg:gap-4 tracking-tight">
                    <span className="w-1 lg:w-2 h-6 lg:h-10 bg-primary rounded-full"></span>
                    {sportName}
                    <span className="text-sm lg:text-xl font-semibold text-muted-foreground ml-2 lg:ml-3">
                      {sportData.total_events} eventos
                    </span>
                  </h2>
                </div>

                {/* League Rows */}
                {Object.entries(sportData.leagues).map(([leagueName, events]) => {
                  const currentRowIndex = rowIndex++
                  return (
                    <LeagueRow
                      key={`${sportName}-${leagueName}`}
                      leagueName={leagueName}
                      events={events}
                      rowIndex={currentRowIndex}
                    />
                  )
                })}
              </div>
            ))}
          </div>
        </main>

        {/* Navigation Hint - Only visible on large screens (TV) */}
        <div className="hidden lg:flex fixed bottom-10 right-10 items-center gap-8 px-8 py-5 bg-secondary/90 rounded-2xl backdrop-blur-sm border border-border">
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xl font-medium">Navegar</span>
            <div className="flex gap-2">
              <kbd className="px-3 py-2 bg-muted rounded-lg text-lg font-mono">{'<'}</kbd>
              <kbd className="px-3 py-2 bg-muted rounded-lg text-lg font-mono">{'>'}</kbd>
              <kbd className="px-3 py-2 bg-muted rounded-lg text-lg font-mono">{'v'}</kbd>
              <kbd className="px-3 py-2 bg-muted rounded-lg text-lg font-mono">{'^'}</kbd>
            </div>
          </div>
          <div className="w-px h-8 bg-border" />
          <div className="flex items-center gap-3 text-muted-foreground">
            <span className="text-xl font-medium">Seleccionar</span>
            <kbd className="px-5 py-2 bg-primary/30 text-primary rounded-lg text-lg font-bold border border-primary/50">OK</kbd>
          </div>
        </div>
      </div>
    </TVNavigationProvider>
  )
}
