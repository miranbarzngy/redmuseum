import { createClient } from '@supabase/supabase-js'

let adminSupabaseClient = null

export const getAdminSupabaseClient = () => {
  if (adminSupabaseClient) return adminSupabaseClient

  if (typeof window === 'undefined') return null

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

  if (!supabaseUrl) {
    console.warn('Supabase URL not configured')
    return null
  }

  // Try to use service key first for admin operations, fall back to anon key
  const key = supabaseServiceKey || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  
  if (!key) {
    console.warn('Supabase credentials not configured')
    return null
  }

  adminSupabaseClient = createClient(supabaseUrl, key)
  return adminSupabaseClient
}

export const adminSupabase = getAdminSupabaseClient()
