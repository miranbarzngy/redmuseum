import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin, getSessionUser } from '../../../lib/api-auth'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

export async function GET(request) {
  if (!await getSessionUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const { data, error } = await supabase.from('admin_roles').select('*').order('created_at', { ascending: true })
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ roles: data })
}

export async function POST(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const { name, description, permissions } = await request.json()
  if (!name?.trim()) return NextResponse.json({ error: 'Role name required' }, { status: 400 })
  const { data, error } = await supabase
    .from('admin_roles')
    .insert({ name: name.trim(), description: description?.trim() || '', permissions: permissions || {} })
    .select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ role: data })
}

export async function PATCH(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const { id, name, description, permissions } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const updates = {}
  if (name) updates.name = name.trim()
  if (description !== undefined) updates.description = description.trim()
  if (permissions !== undefined) updates.permissions = permissions
  const { data, error } = await supabase.from('admin_roles').update(updates).eq('id', id).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ role: data })
}

export async function DELETE(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })
  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })
  const { error } = await supabase.from('admin_roles').delete().eq('id', id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
