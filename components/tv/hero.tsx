'use client'

import { useFocusable } from '@/hooks/use-tv-navigation'
import { cn } from '@/lib/utils'
import type { Event } from '@/lib/types'
import { useRouter } from 'next/navigation'
import { ProxyImage } from './proxy-image'

interface HeroProps {
  event: Event
}

export function TVHero({ event }: HeroProps) {
  const router = useRouter()
  
  const { ref, focused } = useFocusable({
    focusKey: 'hero-watch',
    row: 0,
    col: 0,
    onEnterPress: () => router.push(`/watch/${event.id}`),
  })

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <section className="relative h-[600px] w-full overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0 bg-cover bg-center">
        {event.thumbnail_url ? (
          <ProxyImage
            src={event.thumbnail_url}
            alt=""
            className="absolute inset-0 w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#1a1a2e] to-[#16213e]" />
        )}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 flex flex-col justify-end h-full px-16 pb-16">
        {/* Live Badge */}
        {event.status === 'live' && (
          <div className="flex items-center gap-3 mb-6">
            <span className="relative flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-primary"></span>
            </span>
            <span className="text-xl font-extrabold text-primary uppercase tracking-widest">
              En Vivo
            </span>
          </div>
        )}

        {/* League */}
        <div className="text-3xl text-muted-foreground font-medium mb-3 tracking-wide">
          {event.league}
        </div>

        {/* Title */}
        <h1 className="text-6xl font-extrabold text-foreground mb-8 text-balance max-w-4xl leading-tight tracking-tight">
          {event.title}
        </h1>

        {/* Teams with Badges */}
        {event.home_team && event.away_team && (
          <div className="flex items-center gap-10 mb-10">
            <div className="flex items-center gap-5">
              <ProxyImage 
                src={event.home_team_badge} 
                alt={event.home_team}
                className="w-20 h-20 object-contain"
              />
              <span className="text-4xl font-bold text-foreground">{event.home_team}</span>
            </div>
            <span className="text-4xl font-black text-primary">VS</span>
            <div className="flex items-center gap-5">
              <ProxyImage 
                src={event.away_team_badge} 
                alt={event.away_team}
                className="w-20 h-20 object-contain"
              />
              <span className="text-4xl font-bold text-foreground">{event.away_team}</span>
            </div>
          </div>
        )}

        {/* Watch Button */}
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={() => router.push(`/watch/${event.id}`)}
          className={cn(
            'flex items-center gap-5 px-12 py-6 rounded-2xl text-3xl font-bold w-fit',
            'bg-primary text-primary-foreground',
            'transition-all duration-300 outline-none',
            'border-4 border-transparent',
            focused && 'scale-105 border-white shadow-[0_0_60px_rgba(239,68,68,0.6)]'
          )}
        >
          <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {event.status === 'live' ? 'VER AHORA' : `VER A LAS ${formatTime(event.start_time)}`}
        </button>
      </div>
    </section>
  )
}
