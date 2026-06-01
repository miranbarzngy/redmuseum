import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getSessionUser } from '../../../lib/api-auth'

// GET — returns the current user's own active status (accessible to any authenticated user)
export async function GET(request) {
  const user = await getSessionUser(request)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  )

  const { data, error } = await supabase.auth.admin.getUserById(user.id)
  if (error || !data?.user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

  const u = data.user
  return NextResponse.json({
    id: u.id,
    email: u.email,
    role: u.user_metadata?.role || 'viewer',
    is_active: !u.banned_until || new Date(u.banned_until) < new Date(),
  })
}
