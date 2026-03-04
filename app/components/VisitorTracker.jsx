'use client'

import { useEffect } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import { supabase } from '../lib/supabase-client'

// Helper function to detect device type from user agent
const getDeviceType = (userAgent) => {
  if (!userAgent) return 'Unknown'
  const mobileRegex = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
  const tabletRegex = /iPad|Android/i
  if (tabletRegex.test(userAgent)) return 'Tablet'
  if (mobileRegex.test(userAgent)) return 'Mobile'
  return 'Desktop'
}

export default function VisitorTracker() {
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Function to log the visit
    const logVisit = async () => {
      // Skip logging for admin pages
      if (pathname.startsWith('/admin')) return
      
      // Skip logging for API routes
      if (pathname.startsWith('/api')) return

      // Get full URL including query params
      const pageUrl = `${pathname}${searchParams.toString() ? '?' + searchParams.toString() : ''}`
      
      // Get user agent
      const userAgent = navigator.userAgent
      const deviceType = getDeviceType(userAgent)

      // Try to get IP (note: this requires a server-side solution for accurate IP)
      // For client-side, we'll leave it null or use a third-party service
      const ipAddress = null

      // Log to console for debugging
      console.log('Logging visit:', { pageUrl, deviceType, userAgent: userAgent.substring(0, 100) })

      // Try to insert into database
      if (supabase) {
        try {
          const { error } = await supabase
            .from('visitor_logs')
            .insert({
              page_url: pageUrl,
              ip_address: ipAddress,
              user_agent: userAgent,
              device_type: deviceType
            })

          if (error) {
            console.error('Error logging visit:', error.message)
          } else {
            console.log('Visit logged successfully')
          }
        } catch (err) {
          console.error('Exception logging visit:', err)
        }
      }
    }

    // Log the visit when pathname changes
    logVisit()
  }, [pathname, searchParams])

  // This component doesn't render anything
  return null
}
