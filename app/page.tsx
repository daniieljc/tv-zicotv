import { TVHome } from '@/components/tv/tv-home'
import { fetchEvents } from '@/lib/api'
import { mockEventsResponse } from '@/lib/mock-data'

export default async function HomePage() {
  let data
  
  try {
    // Fetch from real API
    data = await fetchEvents()
  } catch (error) {
    // Fallback to mock data if API fails
    console.error('Failed to fetch from API, using mock data:', error)
    data = mockEventsResponse
  }

  return <TVHome data={data} />
}
