'use client'

import Script from 'next/script'
import { useEffect } from 'react'

export default function GoogleApiScript() {
  useEffect(() => {
    // This will run on mount to set up a global flag we can check
    window.__GOOGLE_API_STATUS = 'loading'
  }, [])

  return (
    <Script
      src="https://accounts.google.com/gsi/client"
      strategy="afterInteractive"
      onLoad={() => {
        window.__GOOGLE_API_STATUS = 'loaded'
        console.log('Google API Client loaded')
      }}
      onError={() => {
        window.__GOOGLE_API_STATUS = 'error'
        console.error('Failed to load Google API Client')
      }}
    />
  )
} 