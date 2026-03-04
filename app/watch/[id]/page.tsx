'use client'

import { useParams } from 'next/navigation'
import { TVNavigationProvider } from '@/hooks/use-tv-navigation'
import { WatchContent } from './watch-content'

export default function WatchPage() {
  const params = useParams()
  const id = params?.id as string

  if (!id) {
    return (
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <span className="text-xl text-white">Cargando...</span>
      </div>
    )
  }

  return (
    <TVNavigationProvider>
      <WatchContent eventId={id} />
    </TVNavigationProvider>
  )
}
