'use client'

import { useState, useEffect } from 'react'
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
  const [formattedTime, setFormattedTime] = useState<string | null>(null)
  
  const { ref, focused } = useFocusable({
    focusKey: 'hero-watch',
    row: 0,
    col: 0,
    onEnterPress: () => router.push(`/watch/?id=${event.id}`),
  })

  useEffect(() => {
    const time = new Date(event.start_time).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
    setFormattedTime(time)
  }, [event.start_time])

  return (
    <section className="relative h-[300px] md:h-[400px] lg:h-[600px] w-full overflow-hidden">
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
      <div className="relative z-10 flex flex-col justify-end h-full px-4 md:px-8 lg:px-16 pb-6 md:pb-10 lg:pb-16">
        {/* Live Badge */}
        {event.status === 'live' && (
          <div className="flex items-center gap-2 lg:gap-3 mb-3 lg:mb-6">
            <span className="relative flex h-3 w-3 lg:h-4 lg:w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 lg:h-4 lg:w-4 bg-primary"></span>
            </span>
            <span className="text-sm lg:text-xl font-extrabold text-primary uppercase tracking-widest">
              En Vivo
            </span>
          </div>
        )}

        {/* League */}
        <div className="text-base md:text-xl lg:text-3xl text-muted-foreground font-medium mb-1 lg:mb-3 tracking-wide">
          {event.league}
        </div>

        {/* Title */}
        <h1 className="text-xl md:text-3xl lg:text-6xl font-extrabold text-foreground mb-4 lg:mb-8 text-balance max-w-4xl leading-tight tracking-tight">
          {event.title}
        </h1>

        {/* Teams with Badges */}
        {event.home_team && event.away_team && (
          <div className="hidden md:flex items-center gap-4 lg:gap-10 mb-6 lg:mb-10">
            <div className="flex items-center gap-2 lg:gap-5">
              <ProxyImage 
                src={event.home_team_badge} 
                alt={event.home_team}
                className="w-10 h-10 lg:w-20 lg:h-20 object-contain"
              />
              <span className="text-lg lg:text-4xl font-bold text-foreground">{event.home_team}</span>
            </div>
            <span className="text-lg lg:text-4xl font-black text-primary">VS</span>
            <div className="flex items-center gap-2 lg:gap-5">
              <ProxyImage 
                src={event.away_team_badge} 
                alt={event.away_team}
                className="w-10 h-10 lg:w-20 lg:h-20 object-contain"
              />
              <span className="text-lg lg:text-4xl font-bold text-foreground">{event.away_team}</span>
            </div>
          </div>
        )}

        {/* Watch Button */}
        <button
          ref={ref as React.Ref<HTMLButtonElement>}
          onClick={() => router.push(`/watch/?id=${event.id}`)}
          className={cn(
            'flex items-center gap-2 lg:gap-5 px-6 py-3 lg:px-12 lg:py-6 rounded-xl lg:rounded-2xl text-base lg:text-3xl font-bold w-fit',
            'bg-primary text-primary-foreground cursor-pointer',
            'transition-all duration-300 outline-none',
            'border-4 border-transparent',
            'hover:scale-105 hover:shadow-[0_0_40px_rgba(239,68,68,0.5)]',
            focused && 'scale-105 border-white shadow-[0_0_60px_rgba(239,68,68,0.6)]'
          )}
        >
          <svg className="w-5 h-5 lg:w-10 lg:h-10" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
          {event.status === 'live' ? 'VER AHORA' : formattedTime ? `VER A LAS ${formattedTime}` : 'VER'}
        </button>
      </div>
    </section>
  )
}
