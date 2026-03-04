'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
import { TVNavigationProvider } from '@/hooks/use-tv-navigation'
import { WatchContent } from './watch-content'

function WatchPageContent() {
  const searchParams = useSearchParams()
  const id = searchParams.get('id')

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

export default function WatchPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center w-screen h-screen bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xl text-white">Cargando...</span>
        </div>
      </div>
    }>
      <WatchPageContent />
    </Suspense>
  )
}
