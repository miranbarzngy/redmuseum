import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const body = await request.json()
  const phone = String(body?.phone || '').trim()

  if (!phone) {
    return NextResponse.json({ error: 'Phone number is required' }, { status: 400 })
  }
  if (!/^[\d\s+\-().]{6,20}$/.test(phone)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const { data, error } = await supabase
    .from('reservations')
    .select('id, name, status, date, time, guest_count, note, created_at, face_image_url')
    .eq('phone', phone)
    .order('date', { ascending: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ reservations: data || [] })
}
