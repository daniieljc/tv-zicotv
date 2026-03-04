'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { useFocusable } from '@/hooks/use-tv-navigation'
import { cn } from '@/lib/utils'
import { ProxyImage } from './proxy-image'
import type { OwnStream, FallbackSource } from '@/lib/types'

interface VideoPlayerProps {
  ownStream: OwnStream | null
  fallbackSources: FallbackSource[]
  thumbnail?: string
}

interface Stream {
  embedUrl: string
  hd: boolean
  language: string
  viewers: number
}

type SourceStatus = 'idle' | 'loading' | 'active' | 'error'

function getSourceLabel(source: string): string {
  const labels: Record<string, string> = { 
    alpha: 'Alpha', delta: 'Delta', echo: 'Echo', golf: 'Golf', admin: 'Premium' 
  }
  return labels[source?.toLowerCase()] ?? source
}

function getSourceQuality(source: string): string {
  const quality: Record<string, string> = { 
    alpha: 'HD', delta: 'FHD', echo: 'HD', golf: 'SD', admin: '4K' 
  }
  return quality[source?.toLowerCase()] ?? 'HD'
}

function isDirectStream(url: string): boolean {
  if (!url) return false
  return /\.(m3u8|mp4|webm|ogg|ts)(\?.*)?$/i.test(url) || url.includes('/proxy?url=')
}

export function VideoPlayer({ ownStream, fallbackSources, thumbnail }: VideoPlayerProps) {
  const [hasInteracted, setHasInteracted] = useState(false)
  const [activeUrl, setActiveUrl] = useState<string | null>(null)
  const [activeSource, setActiveSource] = useState<'own' | number | null>(null)
  const [activeStreamIdx, setActiveStreamIdx] = useState(0)
  const [playerLoading, setPlayerLoading] = useState(false)
  const [playerError, setPlayerError] = useState(false)
  const [resolvedSources, setResolvedSources] = useState<Record<number, Stream[]>>({})
  const [sourceStatuses, setSourceStatuses] = useState<Record<string, SourceStatus>>({})
  const [focusedSourceIdx, setFocusedSourceIdx] = useState(0)

  const totalSources = (ownStream ? 1 : 0) + (fallbackSources?.length || 0)

  // Prefetch fallback sources - using external API directly for static export
  useEffect(() => {
    fallbackSources?.slice(0, 3).forEach(async (source, index) => {
      try {
        const res = await fetch(`https://zicotv.cc/api/streams/${source.source}/${source.id}`)
        const data = await res.json()
        if (data.available) {
          setResolvedSources(prev => ({ ...prev, [index]: data.streams }))
        }
      } catch {}
    })
  }, [fallbackSources])

  const setStatus = useCallback((key: string, status: SourceStatus) => {
    setSourceStatuses(prev => ({ ...prev, [key]: status }))
  }, [])

  const handleStartStream = async (type: 'own' | number, streamIdx = 0) => {
    setHasInteracted(true)
    setPlayerLoading(true)
    setPlayerError(false)

    if (activeSource !== null) {
      setStatus(activeSource === 'own' ? 'own' : String(activeSource), 'idle')
    }

    try {
      if (type === 'own' && ownStream) {
        const url = ownStream.output_path
        setActiveUrl(url)
        setActiveSource('own')
        setActiveStreamIdx(0)
        setStatus('own', 'active')
      } else if (typeof type === 'number') {
        setStatus(String(type), 'loading')
        let streams = resolvedSources[type]
        
        if (!streams && fallbackSources?.[type]) {
          const res = await fetch(`https://zicotv.cc/api/streams/${fallbackSources[type].source}/${fallbackSources[type].id}`)
          const data = await res.json()
          streams = data.available ? data.streams : []
          setResolvedSources(prev => ({ ...prev, [type]: streams }))
        }

        if (streams?.length > 0) {
          const idx = Math.min(streamIdx, streams.length - 1)
          setActiveUrl(streams[idx].embedUrl)
          setActiveSource(type)
          setActiveStreamIdx(idx)
          setStatus(String(type), 'active')
        } else {
          setPlayerError(true)
          setStatus(String(type), 'error')
        }
      }
    } catch {
      setPlayerError(true)
      if (type !== 'own') setStatus(String(type), 'error')
    } finally {
      setPlayerLoading(false)
    }
  }

  const handleSwitchStream = (streamIdx: number) => {
    if (activeSource === null || activeSource === 'own') return
    const streams = resolvedSources[activeSource as number]
    if (!streams?.[streamIdx]) return
    setActiveUrl(streams[streamIdx].embedUrl)
    setActiveStreamIdx(streamIdx)
  }

  // Keyboard navigation for TV
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!hasInteracted) {
        // Before interaction - navigate sources
        if (e.key === 'ArrowLeft') {
          e.preventDefault()
          setFocusedSourceIdx(prev => Math.max(0, prev - 1))
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          setFocusedSourceIdx(prev => Math.min(totalSources - 1, prev + 1))
        } else if (e.key === 'Enter') {
          e.preventDefault()
          const isOwn = ownStream && focusedSourceIdx === 0
          if (isOwn) {
            handleStartStream('own')
          } else {
            const idx = ownStream ? focusedSourceIdx - 1 : focusedSourceIdx
            handleStartStream(idx)
          }
        }
      } else {
        // After interaction - switch sources/streams
        if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
          e.preventDefault()
          const direction = e.key === 'ArrowLeft' ? -1 : 1
          const currentIdx = activeSource === 'own' ? 0 : (ownStream ? (activeSource as number) + 1 : activeSource as number)
          const newIdx = Math.max(0, Math.min(totalSources - 1, currentIdx + direction))
          
          const isOwn = ownStream && newIdx === 0
          if (isOwn) {
            handleStartStream('own')
          } else {
            const idx = ownStream ? newIdx - 1 : newIdx
            handleStartStream(idx)
          }
        } else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
          // Switch streams within same source
          if (activeSource !== null && activeSource !== 'own') {
            const streams = resolvedSources[activeSource]
            if (streams && streams.length > 1) {
              e.preventDefault()
              const direction = e.key === 'ArrowUp' ? -1 : 1
              const newIdx = Math.max(0, Math.min(streams.length - 1, activeStreamIdx + direction))
              handleSwitchStream(newIdx)
            }
          }
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [hasInteracted, focusedSourceIdx, activeSource, activeStreamIdx, totalSources, ownStream, resolvedSources])

  return (
    <div className="absolute inset-0 bg-black">
      {/* Player Area */}
      {!hasInteracted ? (
        <PlayScreen 
          thumbnail={thumbnail}
          totalSources={totalSources}
          onPlay={() => handleStartStream(ownStream ? 'own' : 0)}
        />
      ) : playerLoading ? (
        <LoadingScreen />
      ) : playerError ? (
        <ErrorScreen onRetry={() => { setPlayerError(false); setHasInteracted(false) }} />
      ) : activeUrl ? (
        isDirectStream(activeUrl) ? (
          <ClapprPlayer url={activeUrl} poster={thumbnail} />
        ) : (
          <iframe 
            src={activeUrl} 
            className="w-full h-full border-0" 
            allowFullScreen 
            allow="autoplay; fullscreen" 
          />
        )
      ) : null}

      {/* Source Selector - shown when interacted */}
      {hasInteracted && !playerLoading && !playerError && (
        <div className="absolute bottom-32 left-8 right-8">
          <div className="text-lg font-bold text-white/60 uppercase tracking-widest mb-4">
            Fuentes disponibles
          </div>
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {/* Own Stream */}
            {ownStream && (
              <SourceButton
                label={ownStream.name || 'Oficial'}
                quality="HD"
                isActive={activeSource === 'own'}
                isLoading={sourceStatuses['own'] === 'loading'}
                isError={sourceStatuses['own'] === 'error'}
                onClick={() => handleStartStream('own')}
              />
            )}

            {/* Fallback Sources */}
            {fallbackSources?.map((source, idx) => {
              const isActive = activeSource === idx
              const streams = resolvedSources[idx] ?? []
              
              return (
                <SourceButton
                  key={idx}
                  label={getSourceLabel(source.source)}
                  quality={getSourceQuality(source.source)}
                  isActive={isActive}
                  isLoading={sourceStatuses[String(idx)] === 'loading'}
                  isError={sourceStatuses[String(idx)] === 'error'}
                  streamCount={streams.length}
                  activeStreamIdx={isActive ? activeStreamIdx : undefined}
                  onClick={() => handleStartStream(idx)}
                />
              )
            })}
          </div>

          {/* Stream Selector (if multiple streams in active source) */}
          {activeSource !== null && activeSource !== 'own' && (
            <StreamSelector
              streams={resolvedSources[activeSource] ?? []}
              activeIdx={activeStreamIdx}
              onSelect={handleSwitchStream}
            />
          )}
        </div>
      )}

      {/* Source Info Overlay */}
      {hasInteracted && activeUrl && !playerLoading && (
        <div className="absolute top-8 left-8 flex items-center gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/80 rounded-lg">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
            </span>
            <span className="text-lg font-bold text-white">EN VIVO</span>
          </div>
          <div className="px-4 py-2 bg-black/80 rounded-lg">
            <span className="text-lg text-white font-medium">
              {activeSource === 'own' 
                ? (ownStream?.name || 'Oficial')
                : fallbackSources?.[activeSource as number] 
                  ? `${getSourceLabel(fallbackSources[activeSource as number].source)} - Stream ${activeStreamIdx + 1}`
                  : ''
              }
            </span>
          </div>
        </div>
      )}

      {/* Navigation Hint */}
      {hasInteracted && !playerLoading && (
        <div className="absolute bottom-6 right-8 flex items-center gap-6 text-muted-foreground">
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">←→</kbd>
            <span className="text-base">Cambiar fuente</span>
          </div>
          <div className="flex items-center gap-2">
            <kbd className="px-2 py-1 bg-white/10 rounded text-sm">↑↓</kbd>
            <span className="text-base">Cambiar stream</span>
          </div>
        </div>
      )}
    </div>
  )
}

function PlayScreen({ thumbnail, totalSources, onPlay }: { thumbnail?: string; totalSources: number; onPlay: () => void }) {
  const { ref, isFocused } = useFocusable('play-btn', 0, 0, onPlay)

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center">
      {thumbnail && (
        <ProxyImage src={thumbnail} alt="" className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md" />
      )}
      <div className="absolute inset-0 bg-gradient-radial from-transparent via-black/50 to-black" />
      <div className="relative z-10 flex flex-col items-center">
        <button
          ref={ref}
          onClick={onPlay}
          className={cn(
            'w-24 h-24 rounded-full bg-primary flex items-center justify-center',
            'transition-all duration-200',
            isFocused && 'scale-110 shadow-[0_0_60px_rgba(230,34,34,0.6)]'
          )}
        >
          <svg className="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </button>
        <div className="mt-6 text-xl font-bold text-white/80 uppercase tracking-widest">
          Ver en vivo
        </div>
        <div className="mt-3 flex items-center gap-4 text-base text-white/50">
          <span>{totalSources} fuente{totalSources !== 1 ? 's' : ''} disponible{totalSources !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  )
}

function LoadingScreen() {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black">
      <div className="w-12 h-12 border-3 border-muted border-t-primary rounded-full animate-spin" />
      <div className="mt-4 text-lg font-bold text-white/60 uppercase tracking-widest">
        Conectando...
      </div>
    </div>
  )
}

function ErrorScreen({ onRetry }: { onRetry: () => void }) {
  const { ref, isFocused } = useFocusable('retry-btn', 0, 0, onRetry)

  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black gap-4">
      <svg className="w-16 h-16 text-primary/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <div className="text-2xl font-bold text-white">Senal no disponible</div>
      <div className="text-lg text-white/50">Prueba con otra fuente</div>
      <button
        ref={ref}
        onClick={onRetry}
        className={cn(
          'mt-4 px-8 py-3 rounded-full bg-primary text-white font-bold uppercase tracking-wide',
          'transition-all duration-200',
          isFocused && 'scale-105 shadow-[0_0_40px_rgba(230,34,34,0.6)]'
        )}
      >
        Volver
      </button>
    </div>
  )
}

interface SourceButtonProps {
  label: string
  quality: string
  isActive: boolean
  isLoading: boolean
  isError: boolean
  streamCount?: number
  activeStreamIdx?: number
  onClick: () => void
}

function SourceButton({ label, quality, isActive, isLoading, isError, streamCount, activeStreamIdx, onClick }: SourceButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading || isError}
      className={cn(
        'flex items-center gap-3 px-5 py-3 rounded-xl border-2 transition-all duration-200 min-w-fit',
        'bg-white/5 border-white/10',
        isActive && 'bg-primary/20 border-primary',
        isError && 'opacity-40 cursor-not-allowed',
        !isActive && !isError && 'hover:bg-white/10 hover:border-white/20'
      )}
    >
      <div className={cn(
        'w-9 h-9 rounded-lg flex items-center justify-center',
        isActive ? 'bg-primary' : 'bg-white/10'
      )}>
        {isLoading ? (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : isActive ? (
          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z" />
          </svg>
        ) : isError ? (
          <svg className="w-4 h-4 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-white/70" fill="currentColor" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        )}
      </div>
      <div className="text-left">
        <div className="text-lg font-semibold text-white">{label}</div>
        <div className="text-sm text-white/50">
          {isActive && streamCount && streamCount > 1
            ? `Stream ${(activeStreamIdx ?? 0) + 1} de ${streamCount}`
            : isError ? 'No disponible' : 'Senal alternativa'
          }
        </div>
      </div>
      <div className={cn(
        'px-2 py-1 rounded text-xs font-bold',
        isActive ? 'bg-primary text-white' : 'bg-white/10 text-white/50'
      )}>
        {quality}
      </div>
    </button>
  )
}

interface StreamSelectorProps {
  streams: Stream[]
  activeIdx: number
  onSelect: (idx: number) => void
}

function StreamSelector({ streams, activeIdx, onSelect }: StreamSelectorProps) {
  if (streams.length <= 1) return null

  return (
    <div className="mt-4 flex gap-2">
      {streams.map((stream, idx) => (
        <button
          key={idx}
          onClick={() => onSelect(idx)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200',
            idx === activeIdx 
              ? 'bg-primary/30 border border-primary' 
              : 'bg-white/5 border border-white/10 hover:bg-white/10'
          )}
        >
          <div className={cn(
            'w-2 h-2 rounded-full',
            idx === activeIdx ? 'bg-primary' : 'bg-white/30'
          )} />
          <span className="text-base font-medium text-white">Stream {idx + 1}</span>
          {stream.viewers > 0 && (
            <span className="text-sm text-white/50">{stream.viewers}</span>
          )}
          <span className={cn(
            'px-1.5 py-0.5 rounded text-xs font-bold',
            stream.hd ? 'bg-primary/20 text-primary' : 'bg-white/10 text-white/50'
          )}>
            {stream.hd ? 'HD' : 'SD'}
          </span>
        </button>
      ))}
    </div>
  )
}

// Clappr Player Component
function ClapprPlayer({ url, poster }: { url: string; poster?: string }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<any>(null)
  const idRef = useRef(`clappr-${Math.random().toString(36).substr(2, 9)}`)

  useEffect(() => {
    let destroyed = false

    const loadClappr = async () => {
      // Load Clappr if not already loaded
      if (!(window as any).Clappr) {
        await new Promise<void>((resolve, reject) => {
          const script = document.createElement('script')
          script.src = 'https://cdn.jsdelivr.net/npm/@clappr/player@latest/dist/clappr.min.js'
          script.onload = () => resolve()
          script.onerror = reject
          document.head.appendChild(script)
        })
      }

      if (destroyed || !containerRef.current) return

      const container = containerRef.current
      const { width, height } = container.getBoundingClientRect()

      playerRef.current = new (window as any).Clappr.Player({
        source: url,
        parentId: `#${idRef.current}`,
        poster: poster || '',
        autoPlay: true,
        width: Math.round(width),
        height: Math.round(height),
        playback: { playInline: true, hlsMinimumDvrSize: 60 },
        mediacontrol: { seekbar: '#e62222', buttons: '#fff' },
      })

      const ro = new ResizeObserver(([entry]) => {
        if (!playerRef.current) return
        const { width: w, height: h } = entry.contentRect
        try {
          playerRef.current.resize({ width: Math.round(w), height: Math.round(h) })
        } catch {}
      })
      ro.observe(container)
      ;(playerRef.current as any)._ro = ro
    }

    loadClappr().catch(console.error)

    return () => {
      destroyed = true
      try { (playerRef.current as any)?._ro?.disconnect() } catch {}
      try { playerRef.current?.destroy() } catch {}
      playerRef.current = null
    }
  }, [url, poster])

  return (
    <div ref={containerRef} className="absolute inset-0 w-full h-full overflow-hidden">
      <div id={idRef.current} className="w-full h-full" />
    </div>
  )
}
