'use client'

import { useState, useEffect } from 'react'
import { useFocusable } from '@/hooks/use-tv-navigation'
import { cn } from '@/lib/utils'
import type { Event } from '@/lib/types'
import { useRouter } from 'next/navigation'

interface EventCardProps {
  event: Event
  focusKey: string
  row: number
  col: number
}

export function EventCard({ event, focusKey, row, col }: EventCardProps) {
  const router = useRouter()
  const [imgError, setImgError] = useState(false)
  const [badgeErrors, setBadgeErrors] = useState<Record<string, boolean>>({})
  const [formattedTime, setFormattedTime] = useState<string>('')

  const handleSelect = () => {
    router.push(`/watch/?id=${event.id}`)
  }

  const { ref, focused } = useFocusable({
    focusKey,
    row,
    col,
    onEnterPress: handleSelect,
  })

  // Format time on client side only to avoid hydration mismatch
  useEffect(() => {
    if (event.start_time) {
      const time = new Date(event.start_time).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
      })
      setFormattedTime(time)
    }
  }, [event.start_time])

  // Helper to get proxied URL for CORS issues
  const getProxiedUrl = (url: string): string => {
    if (url.startsWith('data:') || url.startsWith('/')) return url
    return `https://wsrv.nl/?url=${encodeURIComponent(url)}&default=placeholder`
  }

  // Helper para renderizar los escudos o el fallback
  const TeamBadge = ({ src, alt, teamKey }: { src?: string; alt: string; teamKey: string }) => (
      <div className="relative w-6 h-6 lg:w-10 lg:h-10 flex-shrink-0">
        {src && !badgeErrors[teamKey] ? (
            <img
                src={getProxiedUrl(src)}
                alt={alt}
                className="w-full h-full object-contain"
                crossOrigin="anonymous"
                referrerPolicy="no-referrer"
                onError={() => setBadgeErrors(prev => ({ ...prev, [teamKey]: true }))}
            />
        ) : (
            <div className="w-full h-full rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-xs lg:text-sm font-bold text-white">{alt.charAt(0)}</span>
            </div>
        )}
      </div>
  )

  return (
      <div
          ref={ref as React.Ref<HTMLDivElement>}
          className={cn(
              'relative flex-shrink-0 w-[280px] md:w-[320px] lg:w-[420px] rounded-xl lg:rounded-2xl overflow-hidden cursor-pointer',
              'transition-all duration-300 ease-out outline-none',
              'border-2 lg:border-4 border-transparent',
              'hover:scale-105 hover:z-20 hover:border-primary hover:shadow-[0_0_40px_rgba(239,68,68,0.4)]',
              focused && 'scale-110 z-20 border-primary shadow-[0_0_60px_rgba(239,68,68,0.5)]',
              !focused && 'lg:opacity-70'
          )}
          tabIndex={-1}
          onClick={handleSelect}
      >
        {/* Thumbnail Container */}
        <div className="relative aspect-video bg-secondary">
          {event.thumbnail_url && !imgError ? (
              <img
                  src={getProxiedUrl(event.thumbnail_url)}
                  alt={event.title}
                  className="absolute inset-0 w-full h-full object-cover"
                  crossOrigin="anonymous"
                  referrerPolicy="no-referrer"
                  onError={() => setImgError(true)}
              />
          ) : (
              <div className="w-full h-full bg-gradient-to-br from-secondary to-muted flex items-center justify-center">
            <span className="text-8xl opacity-20">
              {event.sport_category === 'FUTBOL' ? '\u26BD' : '\uD83C\uDFC6'}
            </span>
              </div>
          )}

          {/* Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

          {/* Live Badge */}
          {event.status === 'live' && (
              <div className="absolute top-3 left-3 lg:top-5 lg:left-5 flex items-center gap-2 lg:gap-3 px-2 py-1 lg:px-4 lg:py-2 bg-primary rounded-lg z-10">
            <span className="relative flex h-2 w-2 lg:h-3 lg:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 lg:h-3 lg:w-3 bg-white"></span>
            </span>
                <span className="text-xs lg:text-base font-extrabold text-white uppercase tracking-widest">Live</span>
              </div>
          )}

          {/* Stream Available */}
          {event.has_stream && (
              <div className="absolute top-3 right-3 lg:top-5 lg:right-5 p-2 lg:p-3 bg-black/70 rounded-full z-10">
                <svg className="w-4 h-4 lg:w-6 lg:h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
          )}

          {/* Content Overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-3 lg:p-6 z-10">
            {event.home_team && event.away_team && event.home_team !== 'Unknown Team' ? (
                <div className="flex items-center justify-between mb-2 lg:mb-3">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <TeamBadge src={event.home_team_badge} alt={event.home_team} teamKey="home" />
                    <span className="text-sm lg:text-xl font-semibold text-white truncate max-w-[80px] lg:max-w-[130px]">
                  {event.home_team}
                </span>
                  </div>
                  <span className="text-sm lg:text-xl font-extrabold text-primary mx-2 lg:mx-3">VS</span>
                  <div className="flex items-center gap-2 lg:gap-3">
                <span className="text-sm lg:text-xl font-semibold text-white truncate max-w-[80px] lg:max-w-[130px]">
                  {event.away_team}
                </span>
                    <TeamBadge src={event.away_team_badge} alt={event.away_team} teamKey="away" />
                  </div>
                </div>
            ) : (
                <h3 className="text-sm lg:text-xl font-semibold text-white mb-2 lg:mb-3 truncate leading-relaxed">
                  {event.title}
                </h3>
            )}

            {/* Time / Status */}
            <div className="flex items-center justify-between gap-2 text-xs lg:text-base">
              <span className="font-bold tabular-nums text-white/80">
                {event.status === 'live' ? 'En directo' : formattedTime || '--:--'}
              </span>
              {event.viewers && event.viewers > 0 ? (
                <span className="flex flex-shrink-0 items-center gap-1 font-bold tabular-nums text-primary">
                  <svg className="h-3.5 w-3.5 lg:h-4 lg:w-4" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 4.5C7 4.5 2.7 7.6 1 12c1.7 4.4 6 7.5 11 7.5s9.3-3.1 11-7.5c-1.7-4.4-6-7.5-11-7.5zm0 12a4.5 4.5 0 110-9 4.5 4.5 0 010 9zm0-7a2.5 2.5 0 100 5 2.5 2.5 0 000-5z" />
                  </svg>
                  {event.viewers.toLocaleString('es-ES')}
                </span>
              ) : event.venue ? (
                <span className="max-w-[100px] truncate text-xs text-white/60 lg:max-w-[200px] lg:text-sm">
                  {event.venue}
                </span>
              ) : null}
            </div>
          </div>
        </div>
      </div>
  )
}
