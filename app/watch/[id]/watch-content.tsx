'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useFocusable } from '@/hooks/use-tv-navigation'
import { VideoPlayer } from '@/components/tv/video-player'
import { ProxyImage } from '@/components/tv/proxy-image'
import { cn } from '@/lib/utils'
import type { EventDetailResponse } from '@/lib/types'

interface WatchContentProps {
  data: EventDetailResponse
}

export function WatchContent({ data }: WatchContentProps) {
  const router = useRouter()
  const [showInfo, setShowInfo] = useState(true)
  const { event, own_stream, fallback_sources } = data

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    })
  }

  return (
    <div className="relative w-screen h-screen bg-black overflow-hidden">
      {/* Video Player */}
      <VideoPlayer 
        ownStream={own_stream} 
        fallbackSources={fallback_sources}
        thumbnail={event.thumbnail_url}
      />

      {/* Back Button */}
      <BackButton onBack={() => router.push('/')} />

      {/* Event Info Overlay */}
      {showInfo && (
        <div className="absolute top-0 left-0 right-0 p-8 bg-gradient-to-b from-black/90 via-black/50 to-transparent">
          <div className="flex items-start justify-between">
            <div>
              {/* Live Badge */}
              {event.status === 'live' && (
                <div className="flex items-center gap-2 mb-3">
                  <span className="relative flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                  </span>
                  <span className="text-xl font-bold text-primary uppercase tracking-wider">
                    En Vivo
                  </span>
                </div>
              )}

              {/* League */}
              <div className="text-xl text-muted-foreground font-medium mb-2">
                {event.league} • {event.sport_category}
              </div>

              {/* Title / Teams */}
              {event.home_team && event.away_team && event.home_team !== 'Unknown Team' && event.away_team !== 'Unknown Team' ? (
                <div className="flex items-center gap-6 mb-4">
                  <div className="flex items-center gap-3">
                    <ProxyImage 
                      src={event.home_team_badge} 
                      alt={event.home_team}
                      className="w-14 h-14 object-contain"
                      fallback={
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{event.home_team?.charAt(0)}</span>
                        </div>
                      }
                    />
                    <span className="text-4xl font-bold text-white">{event.home_team}</span>
                  </div>
                  <span className="text-3xl font-bold text-muted-foreground">VS</span>
                  <div className="flex items-center gap-3">
                    <span className="text-4xl font-bold text-white">{event.away_team}</span>
                    <ProxyImage 
                      src={event.away_team_badge} 
                      alt={event.away_team}
                      className="w-14 h-14 object-contain"
                      fallback={
                        <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
                          <span className="text-xl font-bold text-white">{event.away_team?.charAt(0)}</span>
                        </div>
                      }
                    />
                  </div>
                </div>
              ) : (
                <h1 className="text-4xl font-bold text-white mb-4">
                  {event.title}
                </h1>
              )}

              {/* Meta */}
              <div className="flex items-center gap-6 text-lg text-muted-foreground">
                {event.venue && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    {event.venue}
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatDate(event.start_time)} • {formatTime(event.start_time)}
                </div>
              </div>
            </div>

            {/* ZICOTV Logo */}
            <div className="text-3xl font-black tracking-tighter text-primary">
              ZICO<span className="text-white">TV</span>
            </div>
          </div>
        </div>
      )}

      {/* Controls Hint */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-8 px-8 py-4 bg-black/70 rounded-xl backdrop-blur-sm">
        <div className="flex items-center gap-3 text-muted-foreground">
          <kbd className="px-3 py-1.5 bg-muted rounded text-base font-medium">ESC</kbd>
          <span className="text-lg">Volver</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-3 text-muted-foreground">
          <kbd className="px-3 py-1.5 bg-muted rounded text-base font-medium">I</kbd>
          <span className="text-lg">Info</span>
        </div>
        <div className="w-px h-6 bg-border" />
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="flex gap-1">
            <kbd className="px-2 py-1.5 bg-muted rounded text-base font-medium">←</kbd>
            <kbd className="px-2 py-1.5 bg-muted rounded text-base font-medium">→</kbd>
          </div>
          <span className="text-lg">Cambiar fuente</span>
        </div>
      </div>
    </div>
  )
}

function BackButton({ onBack }: { onBack: () => void }) {
  const { ref, isFocused } = useFocusable('back-btn', 0, 0, onBack)

  return (
    <button
      ref={ref}
      onClick={onBack}
      className={cn(
        'absolute top-8 left-8 flex items-center gap-3 px-5 py-3 rounded-xl z-50',
        'bg-black/70 backdrop-blur-sm transition-all duration-200',
        'border-2 border-transparent outline-none',
        isFocused && 'border-primary scale-105 shadow-[0_0_30px_rgba(239,68,68,0.5)]'
      )}
    >
      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
      </svg>
      <span className="text-lg font-medium text-white">Volver</span>
    </button>
  )
}
