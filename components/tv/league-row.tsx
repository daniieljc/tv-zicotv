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
    <div className="mb-10">
      {/* League Title */}
      <div className="flex items-center gap-5 px-16 mb-6">
        <h3 className="text-2xl font-bold text-foreground tracking-tight">
          {leagueName}
        </h3>
        <div className="h-px flex-1 bg-border/30 max-w-32" />
        <span className="text-lg text-muted-foreground font-semibold">
          {events.length}
        </span>
      </div>

      {/* Events Row */}
      <div className="flex gap-8 px-16 overflow-x-auto scrollbar-hide pb-6">
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
