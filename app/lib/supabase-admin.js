import { createClient } from '@supabase/supabase-js'

// Server-only — never import this file in client components
let adminSupabaseClient = null

export const getAdminSupabaseClient = () => {
  if (typeof window !== 'undefined') {
    throw new Error('supabase-admin must only be used server-side')
  }
  if (adminSupabaseClient) return adminSupabaseClient

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn('Supabase admin credentials not configured')
    return null
  }

  adminSupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false },
  })
  return adminSupabaseClient
}
