import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

// POST — verify token and set HttpOnly session cookie
export async function POST(request) {
  const { access_token } = await request.json()
  if (!access_token) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) return NextResponse.json({ error: 'Server not configured' }, { status: 500 })

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data: { user }, error } = await supabase.auth.getUser(access_token)
  if (error || !user) return NextResponse.json({ error: 'Invalid token' }, { status: 401 })

  const isProd = process.env.NODE_ENV === 'production'
  const cookieVal = `sb-admin-token=${encodeURIComponent(access_token)}; Path=/; Max-Age=3600; HttpOnly; SameSite=Strict${isProd ? '; Secure' : ''}`

  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', cookieVal)
  return response
}

// DELETE — clear the session cookie (logout)
export async function DELETE() {
  const response = NextResponse.json({ ok: true })
  response.headers.set('Set-Cookie', 'sb-admin-token=; Path=/; Max-Age=0; HttpOnly; SameSite=Strict')
  return response
}
