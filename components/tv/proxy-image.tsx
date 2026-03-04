'use client'

import { useState } from 'react'

interface ProxyImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallback?: React.ReactNode
}

export function ProxyImage({ src, alt, className, fallback }: ProxyImageProps) {
  const [error, setError] = useState(false)

  if (!src || error) {
    return fallback ? <>{fallback}</> : null
  }

  // Check if the image needs proxying (external images that may have CORS issues)
  const needsProxy = src.includes('thesportsdb.com') || src.includes('r2.thesportsdb.com')
  const imageSrc = needsProxy ? `/api/image-proxy?url=${encodeURIComponent(src)}` : src

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={() => setError(true)}
    />
  )
}
