import type { EventsResponse, EventDetailResponse } from './types'

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://zicotv.cc/api'

export async function fetchEvents(): Promise<EventsResponse> {
  const res = await fetch(`${API_BASE_URL}/events`)
  
  if (!res.ok) {
    throw new Error('Failed to fetch events')
  }
  
  return res.json()
}

export async function fetchEvent(id: number): Promise<EventDetailResponse> {
  const res = await fetch(`${API_BASE_URL}/events/${id}`)
  
  if (!res.ok) {
    throw new Error('Failed to fetch event')
  }
  
  return res.json()
}
