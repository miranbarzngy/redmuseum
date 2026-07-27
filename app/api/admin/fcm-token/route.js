import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

const CORS = {
  'Access-Control-Allow-Origin': 'capacitor://localhost',
  'Access-Control-Allow-Methods': 'POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS })
}

async function getAdminUser(req) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) return null

  const cookieStore = cookies()
  const token = cookieStore.get('sb-access-token')?.value
  if (!token) return null

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })
  const { data: { user }, error } = await supabase.auth.getUser(decodeURIComponent(token))
  return error ? null : user
}

// POST — register FCM token for this admin device
export async function POST(req) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })

  const { token } = await req.json()
  if (!token || typeof token !== 'string') {
    return NextResponse.json({ error: 'Missing token' }, { status: 400, headers: CORS })
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  )

  const { error } = await supabase
    .from('admin_fcm_tokens')
    .upsert({ token, admin_id: user.id, updated_at: new Date().toISOString() }, { onConflict: 'token' })

  if (error) return NextResponse.json({ error: error.message }, { status: 500, headers: CORS })
  return NextResponse.json({ ok: true }, { headers: CORS })
}

// DELETE — remove FCM token (logout / unregister)
export async function DELETE(req) {
  const user = await getAdminUser(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401, headers: CORS })

  const { token } = await req.json()
  if (!token) return NextResponse.json({ error: 'Missing token' }, { status: 400, headers: CORS })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  )

  await supabase.from('admin_fcm_tokens').delete().eq('token', token)
  return NextResponse.json({ ok: true }, { headers: CORS })
}
