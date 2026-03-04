'use client'

import { use } from 'react'
import { TVNavigationProvider } from '@/hooks/use-tv-navigation'
import { WatchContent } from './watch-content'

interface WatchPageProps {
  params: Promise<{ id: string }>
}

export default function WatchPage({ params }: WatchPageProps) {
  const { id } = use(params)

  return (
    <TVNavigationProvider>
      <WatchContent eventId={id} />
    </TVNavigationProvider>
  )
}

// Required for static export with dynamic routes
export function generateStaticParams() {
  return []
}

export const dynamicParams = true
