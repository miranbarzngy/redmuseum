import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { getSessionUser } from '../../lib/api-auth'

function getSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// GET — public, returns all active cards sorted by order_index
export async function GET() {
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { data, error } = await supabase
    .from('showcase_cards')
    .select('*')
    .eq('is_active', true)
    .order('order_index', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ cards: data || [] })
}

// POST — create a new card (admin only)
export async function POST(request) {
  if (!await getSessionUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const body = await request.json()
  const { title_ku, title_en, title_ar, image_url, redirect_url, order_index } = body

  if (!image_url) return NextResponse.json({ error: 'image_url is required' }, { status: 400 })

  if (redirect_url) {
    try { const u = new URL(redirect_url); if (!['http:', 'https:'].includes(u.protocol)) throw new Error() }
    catch { return NextResponse.json({ error: 'redirect_url must be a valid http/https URL' }, { status: 400 }) }
  }

  const { data, error } = await supabase
    .from('showcase_cards')
    .insert({ title_ku, title_en, title_ar, image_url, redirect_url: redirect_url || null, order_index: order_index ?? 0 })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ card: data })
}

// PATCH — update a card (admin only)
export async function PATCH(request) {
  if (!await getSessionUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const body = await request.json()
  const { id } = body
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const ALLOWED = ['title_ku', 'title_en', 'title_ar', 'image_url', 'redirect_url', 'order_index', 'is_active']
  const updates = {}
  ALLOWED.forEach(k => { if (body[k] !== undefined) updates[k] = body[k] })

  if (updates.redirect_url) {
    try { const u = new URL(updates.redirect_url); if (!['http:', 'https:'].includes(u.protocol)) throw new Error() }
    catch { return NextResponse.json({ error: 'redirect_url must be a valid http/https URL' }, { status: 400 }) }
  }

  const { data, error } = await supabase
    .from('showcase_cards')
    .update(updates)
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ card: data })
}

// DELETE — delete a card (admin only)
export async function DELETE(request) {
  if (!await getSessionUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getSupabase()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

  const { error } = await supabase.from('showcase_cards').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
