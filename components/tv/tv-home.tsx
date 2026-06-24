'use client'

import { useState, useMemo } from 'react'
import { TVNavigationProvider } from '@/hooks/use-tv-navigation'
import { eventScore } from '@/lib/api'
import { TVHeader } from './header'
import { TVHero } from './hero'
import { LeagueRow } from './league-row'
import type { EventsResponse, Event } from '@/lib/types'

interface TVHomeProps {
  data: EventsResponse
}

export function TVHome({ data }: TVHomeProps) {
  const [activeTab, setActiveTab] = useState('all')

  // Todos los eventos en plano.
  const allEvents = useMemo(() => {
    const list: Event[] = []
    Object.values(data.events_by_sport).forEach((sport) => {
      Object.values(sport.leagues).forEach((events) => list.push(...events))
    })
    return list
  }, [data])

  // "Lo más visto": por puntuación (espectadores reales + en vivo), sin repetir.
  const mostViewed = useMemo(() => {
    const seen = new Set<number>()
    return [...allEvents]
        .filter((e) => eventScore(e) > 0)
        .sort((a, b) => eventScore(b) - eventScore(a))
        .filter((e) => (seen.has(e.id) ? false : (seen.add(e.id), true)))
        .slice(0, 12)
  }, [allEvents])

  // Hero = el evento más visto (o el primero en vivo, o el primero).
  const heroEvent = useMemo(
      () => mostViewed[0] || allEvents.find((e) => e.status === 'live') || allEvents[0],
      [mostViewed, allEvents],
  )

  const filteredSports = useMemo(() => {
    if (activeTab === 'all') return data.events_by_sport
    const filtered: typeof data.events_by_sport = {}
    if (data.events_by_sport[activeTab]) filtered[activeTab] = data.events_by_sport[activeTab]
    return filtered
  }, [data.events_by_sport, activeTab])

  const showMostViewed = activeTab === 'all' && mostViewed.length > 1

  // Índices de fila para la navegación por mando (0 = hero).
  let rowIndex = 1

  return (
      <TVNavigationProvider initialFocusKey="hero-watch">
        <div className="min-h-screen overflow-x-hidden overflow-y-auto bg-background">
          <TVHeader
              activeTab={activeTab}
              onTabChange={setActiveTab}
              liveCount={data.live_events}
              sports={data.available_sports}
          />

          <main className="pt-20 md:pt-24 lg:pt-28">
            {heroEvent && <TVHero event={heroEvent} />}

            <div className="space-y-8 py-6 lg:space-y-14 lg:py-12">
              {/* Lo más visto */}
              {showMostViewed && (
                  <LeagueRow
                      leagueName="🔥 Lo más visto"
                      events={mostViewed}
                      rowIndex={rowIndex++}
                  />
              )}

              {/* Por deporte → liga */}
              {Object.entries(filteredSports).map(([sportName, sportData]) => (
                  <section key={sportName} className="space-y-4 lg:space-y-8">
                    <div className="flex items-center gap-3 px-4 md:px-8 lg:gap-4 lg:px-16">
                      <span className="h-6 w-1 rounded-full bg-primary lg:h-10 lg:w-1.5" />
                      <h2 className="text-xl font-black tracking-tight text-foreground md:text-2xl lg:text-4xl">
                        {sportName}
                      </h2>
                      <span className="text-sm font-semibold text-muted-foreground lg:text-xl">
                    {sportData.total_events} eventos
                  </span>
                    </div>

                    {Object.entries(sportData.leagues).map(([leagueName, events]) => (
                        <LeagueRow
                            key={`${sportName}-${leagueName}`}
                            leagueName={leagueName}
                            events={events}
                            rowIndex={rowIndex++}
                        />
                    ))}
                  </section>
              ))}
            </div>
          </main>

          {/* Ayuda de navegación (solo en pantalla grande / TV) */}
          <div className="fixed bottom-8 right-8 hidden items-center gap-6 rounded-2xl border border-border bg-secondary/90 px-6 py-4 backdrop-blur-sm lg:flex">
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="text-lg font-medium">Navegar</span>
              <div className="flex gap-1.5">
                {['←', '→', '↑', '↓'].map((k) => (
                    <kbd key={k} className="rounded-md bg-muted px-2.5 py-1.5 font-mono text-base">{k}</kbd>
                ))}
              </div>
            </div>
            <span className="h-7 w-px bg-border" />
            <div className="flex items-center gap-3 text-muted-foreground">
              <span className="text-lg font-medium">Seleccionar</span>
              <kbd className="rounded-md border border-primary/50 bg-primary/30 px-4 py-1.5 text-base font-bold text-primary">OK</kbd>
            </div>
          </div>
        </div>
      </TVNavigationProvider>
  )
}
