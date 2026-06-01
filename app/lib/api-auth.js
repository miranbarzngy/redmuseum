import { createClient } from '@supabase/supabase-js'

function extractToken(request) {
  const cookie = request.headers.get('cookie') || ''
  // Prefer HttpOnly cookie set server-side; fall back to legacy manual cookie
  const httpOnly = cookie.match(/sb-admin-token=([^;]+)/)
  if (httpOnly) return decodeURIComponent(httpOnly[1])
  const legacy = cookie.match(/sb-access-token=([^;]+)/)
  if (legacy) return decodeURIComponent(legacy[1])
  return null
}

export async function getSessionUser(request) {
  const token = extractToken(request)
  if (!token) return null

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { persistSession: false } }
  )

  const { data: { user }, error } = await supabase.auth.getUser(token)
  if (error || !user) return null
  return user
}

// Returns the user only if their role is 'admin'; null otherwise.
export async function requireAdmin(request) {
  const user = await getSessionUser(request)
  if (!user) return null
  if ((user.user_metadata?.role || 'viewer') !== 'admin') return null
  return user
}
