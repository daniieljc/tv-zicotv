export interface Event {
  id: number
  title: string
  league: string
  start_time: string
  status: 'live' | 'scheduled'
  sport_category: string
  home_team: string | null
  away_team: string | null
  home_team_badge: string | null
  away_team_badge: string | null
  venue: string | null
  thumbnail_url: string | null
  has_own_stream?: boolean
  has_fallback_stream?: boolean
  has_stream?: boolean
}

export interface LeagueEvents {
  [leagueName: string]: Event[]
}

export interface SportData {
  leagues: LeagueEvents
  total_events: number
  leagues_count: number
}

export interface EventsBySport {
  [sportCategory: string]: SportData
}

export interface EventsResponse {
  success: boolean
  events_by_sport: EventsBySport
  total_events: number
  live_events: number
  available_sports: string[]
}

export interface Stream {
  embedUrl: string
  hd: boolean
  language: string
  viewers: number
}

export interface FallbackSource {
  id: string
  source: string
  streams: Stream[]
}

export interface OwnStream {
  name: string
  output_path: string
  type?: string
  is_streaming?: boolean
}

export interface EventDetailResponse {
  success: boolean
  event: Event
  own_stream: OwnStream | null
  fallback_sources: FallbackSource[]
}

export type SportCategory = 'FÚTBOL' | 'BASKET' | 'TENIS' | 'MOTOR' | 'UFC' | 'BOXEO' | 'NFL' | 'MLB'

export const SPORT_ICONS: Record<string, string> = {
  'FÚTBOL': '⚽',
  'BASKET': '🏀', 
  'TENIS': '🎾',
  'MOTOR': '🏎️',
  'UFC': '🥊',
  'BOXEO': '🥊',
  'NFL': '🏈',
  'MLB': '⚾',
}
