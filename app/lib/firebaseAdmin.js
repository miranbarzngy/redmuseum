import { initializeApp, getApps, cert } from 'firebase-admin/app'
import { getMessaging } from 'firebase-admin/messaging'

function getApp() {
  if (getApps().length) return getApps()[0]
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT
  if (!raw) throw new Error('FIREBASE_SERVICE_ACCOUNT env var is not set')
  return initializeApp({ credential: cert(JSON.parse(raw)) })
}

export async function sendPushToAdmins(tokens, title, body, data = {}) {
  if (!tokens.length) return
  const messaging = getMessaging(getApp())
  const results = await Promise.allSettled(
    tokens.map((token) =>
      messaging.send({
        token,
        notification: { title, body },
        data: Object.fromEntries(Object.entries(data).map(([k, v]) => [k, String(v)])),
        android: {
          priority: 'high',
          notification: {
            sound: 'default',
            channelId: 'admin_alerts',
          },
        },
      })
    )
  )
  return results
}
