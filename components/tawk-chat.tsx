'use client'

import { useEffect } from 'react'

declare global {
  interface Window {
    Tawk_API?: {
      toggle?: () => void
      maximize?: () => void
      minimize?: () => void
      hideWidget?: () => void
      showWidget?: () => void
      setAttributes?: (attributes: Record<string, string>, callback?: (error: Error | null) => void) => void
    }
    Tawk_LoadStart?: Date
  }
}

interface TawkChatProps {
  propertyId: string
  widgetId: string
  // Optional: Pass user info for identification
  user?: {
    name?: string
    email?: string
    hash?: string // For secure mode
  }
}

export function TawkChat({ propertyId, widgetId, user }: TawkChatProps) {
  useEffect(() => {
    // Prevent multiple script loads
    if (document.getElementById('tawk-script')) return

    // Set Tawk API defaults
    window.Tawk_API = window.Tawk_API || {}
    window.Tawk_LoadStart = new Date()

    // Create and load script
    const script = document.createElement('script')
    script.id = 'tawk-script'
    script.async = true
    script.src = `https://embed.tawk.to/${propertyId}/${widgetId}`
    script.charset = 'UTF-8'
    script.setAttribute('crossorigin', '*')

    document.head.appendChild(script)

    // Set user attributes once loaded
    if (user) {
      script.onload = () => {
        setTimeout(() => {
          window.Tawk_API?.setAttributes?.(
            {
              name: user.name || '',
              email: user.email || '',
              hash: user.hash || '',
            },
            (error) => {
              if (error) {
                console.error('Tawk.to: Failed to set user attributes', error)
              }
            }
          )
        }, 1000)
      }
    }

    return () => {
      // Cleanup on unmount (optional - widget persists across pages)
      const existingScript = document.getElementById('tawk-script')
      if (existingScript) {
        existingScript.remove()
      }
    }
  }, [propertyId, widgetId, user])

  return null // This component doesn't render anything
}
