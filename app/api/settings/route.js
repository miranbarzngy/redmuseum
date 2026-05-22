import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getSessionUser } from '../../lib/api-auth'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const key = searchParams.get('key')
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', key)
    .maybeSingle()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ value: data?.value ?? null })
}

export async function POST(request) {
  if (!await getSessionUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { key, value } = await request.json()
  if (!key || value === undefined) return NextResponse.json({ error: 'Missing key or value' }, { status: 400 })

  const { error } = await supabase
    .from('site_settings')
    .upsert({ key, value: String(value), updated_at: new Date().toISOString() }, { onConflict: 'key' })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
