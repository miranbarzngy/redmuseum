'use client'

import { useEffect } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

export default function PushNotificationInit() {
  useEffect(() => {
    async function init() {
      // Only runs inside the Capacitor Android WebView
      const cap = window.Capacitor
      if (!cap?.isNativePlatform?.()) return

      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')

        // Create notification channel (Android 8+ requirement)
        await PushNotifications.createChannel({
          id: 'admin_alerts',
          name: 'ئاگادارکردنەوەی ئەدمین',
          importance: 5,
          sound: 'default',
          vibration: true,
          visibility: 1,
        })

        // Register token with our API when FCM issues one
        PushNotifications.addListener('registration', async ({ value: fcmToken }) => {
          try {
            // Use Supabase session from localStorage — reliable in Capacitor WebView
            const supabaseClient = getSupabaseClient()
            const { data: { session } } = await supabaseClient.auth.getSession()
            const authToken = session?.access_token

            if (!authToken) {
              console.error('[FCM] No auth session — cannot register token')
              return
            }

            const res = await fetch('/api/admin/fcm-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken,
              },
              body: JSON.stringify({ token: fcmToken }),
            })

            if (!res.ok) {
              const err = await res.text()
              console.error('[FCM] Token save failed:', res.status, err)
            } else {
              console.log('[FCM] Token registered successfully')
            }
          } catch (e) {
            console.error('[FCM] Token save error:', e)
          }
        })

        PushNotifications.addListener('registrationError', (err) => {
          console.error('[FCM] Registration error:', JSON.stringify(err))
        })

        // Tapping a notification — route to the relevant admin page
        PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
          const data = action.notification?.data ?? {}
          if (data.type === 'reservation') {
            window.location.href = '/admin/visitors'
          } else if (data.type === 'message') {
            window.location.href = '/admin/messages'
          } else {
            window.location.href = '/admin/dashboard'
          }
        })

        const perm = await PushNotifications.requestPermissions()
        if (perm.receive !== 'granted') {
          console.error('[FCM] Notification permission denied:', perm.receive)
          return
        }

        await PushNotifications.register()
        console.log('[FCM] Registration requested')
      } catch (e) {
        console.error('[FCM] Push init error:', e)
      }
    }
    init()
  }, [])

  return null
}
