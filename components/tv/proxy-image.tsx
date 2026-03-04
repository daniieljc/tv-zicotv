'use client'

import { useState } from 'react'

interface ProxyImageProps {
  src: string | null | undefined
  alt: string
  className?: string
  fallback?: React.ReactNode
}

// Proxy service to bypass CORS issues
function getProxiedUrl(url: string): string {
  // If it's already a data URL or relative URL, return as is
  if (url.startsWith('data:') || url.startsWith('/')) {
    return url
  }
  
  // Use a CORS proxy for external images
  // wsrv.nl is a free image proxy/CDN that handles CORS
  try {
    const encodedUrl = encodeURIComponent(url)
    return `https://wsrv.nl/?url=${encodedUrl}&default=placeholder`
  } catch {
    return url
  }
}

export function ProxyImage({ src, alt, className, fallback }: ProxyImageProps) {
  const [error, setError] = useState(false)
  const [useProxy, setUseProxy] = useState(false)

  if (!src || error) {
    return fallback ? <>{fallback}</> : null
  }

  const handleError = () => {
    if (!useProxy) {
      // First try with proxy
      setUseProxy(true)
    } else {
      // Proxy also failed, show fallback
      setError(true)
    }
  }

  const imageSrc = useProxy ? getProxiedUrl(src) : src

  return (
    <img
      src={imageSrc}
      alt={alt}
      className={className}
      onError={handleError}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
    />
  )
}
