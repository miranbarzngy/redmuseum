import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getSessionUser, requireAdmin } from '../../../lib/api-auth'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// GET — list recent audit log entries (any authenticated admin)
export async function GET(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '100'), 500)

  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ logs: data || [] })
}

// POST — write an audit log entry (any authenticated admin)
export async function POST(request) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { action, entity, entity_id, details } = await request.json()
  if (!action || !entity) return NextResponse.json({ error: 'action and entity are required' }, { status: 400 })

  const { error } = await supabase.from('audit_logs').insert({
    user_id:    user.id,
    user_email: user.email,
    user_name:  user.user_metadata?.full_name || '',
    action:     String(action).slice(0, 64),
    entity:     String(entity).slice(0, 64),
    entity_id:  entity_id ? String(entity_id).slice(0, 128) : null,
    details:    details || {},
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
