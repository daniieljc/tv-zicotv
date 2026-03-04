import { TVNavigationProvider } from '@/hooks/use-tv-navigation'
import { WatchContent } from './watch-content'
import { fetchEvent } from '@/lib/api'

interface WatchPageProps {
  params: Promise<{ id: string }>
}

export default async function WatchPage({ params }: WatchPageProps) {
  const { id } = await params
  
  const data = await fetchEvent(parseInt(id))

  return (
    <TVNavigationProvider>
      <WatchContent data={data} />
    </TVNavigationProvider>
  )
}
