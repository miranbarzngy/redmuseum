import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const report = {}

  // 1. Check env var
  report.firebase_env_set = !!process.env.FIREBASE_SERVICE_ACCOUNT

  // 2. Check Supabase connection
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  report.supabase_configured = !!(supabaseUrl && serviceKey)

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Supabase not configured', report })
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  // 3. Check if admin_fcm_tokens table exists
  try {
    const { data, error } = await supabase.from('admin_fcm_tokens').select('token').limit(5)
    if (error) {
      report.fcm_tokens_table = 'ERROR: ' + error.message
      report.fcm_token_count = 0
    } else {
      report.fcm_tokens_table = 'OK'
      report.fcm_token_count = data.length
      report.tokens_preview = data.map(r => r.token.slice(0, 20) + '...')
    }
  } catch (e) {
    report.fcm_tokens_table = 'EXCEPTION: ' + e.message
  }

  // 4. Try sending a real test push if tokens exist
  if (report.firebase_env_set && report.fcm_token_count > 0) {
    try {
      const { sendPushToAdmins } = await import('../../../lib/firebaseAdmin')
      const { data: tokenRows } = await supabase.from('admin_fcm_tokens').select('token')
      const tokens = (tokenRows ?? []).map(r => r.token)
      const results = await sendPushToAdmins(tokens, 'تێستی ئاگادارکردنەوە 🔔', 'ئاگادارکردنەوەکەت کار دەکات!', { type: 'test' })
      report.push_sent = true
      report.push_results = results.map(r => r.status)
    } catch (e) {
      report.push_sent = false
      report.push_error = e.message
    }
  } else {
    report.push_sent = false
    report.push_skip_reason = !report.firebase_env_set
      ? 'FIREBASE_SERVICE_ACCOUNT not set in Vercel env vars'
      : 'No FCM tokens registered — log into admin APK first'
  }

  return NextResponse.json(report)
}
