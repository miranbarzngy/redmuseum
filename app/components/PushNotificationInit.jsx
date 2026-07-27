'use client'

import { useEffect } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

function log(step, data) {
  try {
    const existing = JSON.parse(localStorage.getItem('fcm_debug') || '[]')
    existing.push({ step, data: data ?? null, ts: new Date().toISOString() })
    localStorage.setItem('fcm_debug', JSON.stringify(existing.slice(-30)))
  } catch (_) {}
}

// Capacitor bridge is injected asynchronously after page load — poll for it
async function waitForCapacitor(maxMs = 10000) {
  const start = Date.now()
  while (Date.now() - start < maxMs) {
    if (window.Capacitor?.isNativePlatform?.()) return true
    await new Promise(r => setTimeout(r, 300))
  }
  return false
}

export default function PushNotificationInit() {
  useEffect(() => {
    async function init() {
      log('start', { ua: navigator.userAgent })

      const isNative = await waitForCapacitor()
      log('capacitor_check', { isNative, hasCapacitor: !!window.Capacitor })

      if (!isNative) return

      try {
        const { PushNotifications } = await import('@capacitor/push-notifications')
        log('plugin_loaded', null)

        await PushNotifications.createChannel({
          id: 'admin_alerts',
          name: 'ئاگادارکردنەوەی ئەدمین',
          importance: 5,
          sound: 'default',
          vibration: true,
          visibility: 1,
        })
        log('channel_created', null)

        PushNotifications.addListener('registration', async ({ value: fcmToken }) => {
          log('got_fcm_token', { tokenPrefix: fcmToken.slice(0, 20) })
          try {
            const supabaseClient = getSupabaseClient()
            const { data: { session } } = await supabaseClient.auth.getSession()
            const authToken = session?.access_token
            log('session_check', { hasSession: !!authToken })

            if (!authToken) return

            const res = await fetch('/api/admin/fcm-token', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + authToken,
              },
              body: JSON.stringify({ token: fcmToken }),
            })
            const body = await res.text()
            log('token_save', { status: res.status, body })
          } catch (e) {
            log('token_save_error', { msg: e.message })
          }
        })

        PushNotifications.addListener('registrationError', (err) => {
          log('registration_error', { err: JSON.stringify(err) })
        })

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
        log('permission', { receive: perm.receive })

        if (perm.receive !== 'granted') return

        await PushNotifications.register()
        log('register_called', null)
      } catch (e) {
        log('error', { msg: e.message, stack: e.stack?.slice(0, 200) })
      }
    }
    init()
  }, [])

  return null
}
