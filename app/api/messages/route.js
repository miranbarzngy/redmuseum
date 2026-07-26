import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { sendPushToAdmins } from '../../lib/firebaseAdmin'

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const body = await request.json()
  const { name, phone, email, message } = body

  if (!name || !message) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('messages')
    .insert([{
      name:       String(name).trim().slice(0, 100),
      phone:      phone   ? String(phone).trim().slice(0, 30)   : null,
      email:      email   ? String(email).trim().slice(0, 100)  : null,
      message:    String(message).trim().slice(0, 1000),
      created_at: new Date().toISOString(),
    }])
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // Fire-and-forget push notification to all admin devices
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    const { data: tokenRows } = await supabase
      .from('admin_fcm_tokens')
      .select('token')

    const tokens = (tokenRows ?? []).map(r => r.token)

    if (tokens.length) {
      sendPushToAdmins(
        tokens,
        'پەیامی نوێ 💬',
        `${String(name).trim()} — ${String(message).trim().slice(0, 60)}`,
        { type: 'message', messageId: String(data.id) }
      ).catch(console.error)
    }
  }

  return NextResponse.json({ ok: true })
}
