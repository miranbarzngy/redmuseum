'use client'

import { useEffect } from 'react'

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
            await fetch('/api/admin/fcm-token', {
              method: 'POST',
              credentials: 'include',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ token: fcmToken }),
            })
          } catch (e) {
            console.error('FCM token save failed', e)
          }
        })

        PushNotifications.addListener('registrationError', (err) => {
          console.error('FCM registration error', err)
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
        if (perm.receive !== 'granted') return

        await PushNotifications.register()
      } catch (e) {
        console.error('Push init error', e)
      }
    }
    init()
  }, [])

  return null
}
