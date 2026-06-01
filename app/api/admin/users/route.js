import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { requireAdmin } from '../../../lib/api-auth'

function getAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_KEY
  if (!url || !key) return null
  return createClient(url, key, { auth: { persistSession: false } })
}

// GET — list all auth users (admin only)
export async function GET(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { data, error } = await supabase.auth.admin.listUsers()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const users = data.users.map(u => ({
    id: u.id,
    email: u.email,
    full_name: u.user_metadata?.full_name || '',
    role: u.user_metadata?.role || 'viewer',
    is_active: !u.banned_until || new Date(u.banned_until) < new Date(),
    created_at: u.created_at,
    last_sign_in_at: u.last_sign_in_at,
  }))

  return NextResponse.json({ users })
}

// POST — create a new user (admin only)
export async function POST(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { email, password, role, full_name } = await request.json()
  if (!email || !password) return NextResponse.json({ error: 'Email and password required' }, { status: 400 })
  if (password.length < 8) return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 })
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })

  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password,
    user_metadata: { role: role || 'viewer', full_name: full_name || '' },
    email_confirm: true,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user: data.user })
}

// PATCH — update user (email, password, role, active status) (admin only)
export async function PATCH(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const { id, email, password, role, full_name, is_active } = await request.json()
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const updates = {}
  if (email) updates.email = email
  if (password) updates.password = password
  if (role !== undefined || full_name !== undefined) {
    updates.user_metadata = {}
    if (role !== undefined) updates.user_metadata.role = role
    if (full_name !== undefined) updates.user_metadata.full_name = full_name
  }
  if (typeof is_active === 'boolean') {
    updates.ban_duration = is_active ? 'none' : '87600h'
  }

  const { data, error } = await supabase.auth.admin.updateUserById(id, updates)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  // If deactivating, immediately revoke all active sessions so the user is logged out now
  if (typeof is_active === 'boolean' && !is_active) {
    try {
      await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/admin/users/${id}/logout`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ scope: 'global' }),
        }
      )
    } catch { /* non-fatal — ban still takes effect on next token refresh */ }
  }

  return NextResponse.json({
    user: {
      id: data.user.id,
      email: data.user.email,
      full_name: data.user.user_metadata?.full_name || '',
      role: data.user.user_metadata?.role || 'viewer',
      is_active: !data.user.banned_until || new Date(data.user.banned_until) < new Date(),
    }
  })
}

// DELETE — delete a user by id in query param (admin only)
export async function DELETE(request) {
  if (!await requireAdmin(request)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const supabase = getAdmin()
  if (!supabase) return NextResponse.json({ error: 'Not configured' }, { status: 500 })

  const id = new URL(request.url).searchParams.get('id')
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 })

  const { error } = await supabase.auth.admin.deleteUser(id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ ok: true })
}
