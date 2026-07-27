import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// Called natively from the Android APK (Java) — no cookie/session available there.
// FCM tokens are opaque strings; writing one here exposes no sensitive data.
export async function POST(req) {
  let body
  try { body = await req.json() } catch { return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 }) }

  const { token } = body ?? {}
  if (!token || typeof token !== 'string' || token.length < 50 || token.length > 1000) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  )

  const { error } = await supabase
    .from('admin_fcm_tokens')
    .upsert({ token, updated_at: new Date().toISOString() }, { onConflict: 'token' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
