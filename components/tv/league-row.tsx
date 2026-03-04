'use client'

import { EventCard } from './event-card'
import type { Event } from '@/lib/types'

interface LeagueRowProps {
  leagueName: string
  events: Event[]
  rowIndex: number
}

export function LeagueRow({ leagueName, events, rowIndex }: LeagueRowProps) {
  return (
    <div className="mb-6 lg:mb-10">
      {/* League Title */}
      <div className="flex items-center gap-3 lg:gap-5 px-4 md:px-8 lg:px-16 mb-3 lg:mb-6">
        <h3 className="text-lg lg:text-2xl font-bold text-foreground tracking-tight">
          {leagueName}
        </h3>
        <div className="h-px flex-1 bg-border/30 max-w-20 lg:max-w-32" />
        <span className="text-sm lg:text-lg text-muted-foreground font-semibold">
          {events.length}
        </span>
      </div>

      {/* Events Row */}
      <div className="flex gap-4 lg:gap-8 px-4 md:px-8 lg:px-16 overflow-x-auto scrollbar-hide pb-4 lg:pb-6">
        {events.map((event, colIndex) => (
          <EventCard
            key={event.id}
            event={event}
            focusKey={`event-${event.id}`}
            row={rowIndex}
            col={colIndex}
          />
        ))}
      </div>
    </div>
  )
}
