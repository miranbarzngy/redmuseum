import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  })

  const body = await request.json()
  const { name, guest_count, phone, date, time, note } = body

  if (!name || !guest_count || !phone || !date || !time) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
  }

  // Input validation
  const nameStr = String(name).trim()
  const phoneStr = String(phone).trim()
  const noteStr = note ? String(note).trim() : null
  const guestNum = Number(guest_count)

  if (nameStr.length < 2 || nameStr.length > 100) {
    return NextResponse.json({ error: 'Name must be 2–100 characters' }, { status: 400 })
  }
  if (!/^[\d\s+\-().]{6,20}$/.test(phoneStr)) {
    return NextResponse.json({ error: 'Invalid phone number' }, { status: 400 })
  }
  if (!Number.isInteger(guestNum) || guestNum < 1 || guestNum > 500) {
    return NextResponse.json({ error: 'Guest count must be between 1 and 500' }, { status: 400 })
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return NextResponse.json({ error: 'Invalid date format' }, { status: 400 })
  }
  if (!/^\d{2}:\d{2}(:\d{2})?$/.test(time)) {
    return NextResponse.json({ error: 'Invalid time format' }, { status: 400 })
  }
  if (noteStr && noteStr.length > 500) {
    return NextResponse.json({ error: 'Note too long (max 500 characters)' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('reservations')
    .insert([{
      name: nameStr,
      guest_count: guestNum,
      phone: phoneStr,
      date,
      time,
      note: noteStr,
      status: 'pending'
    }])
    .select()
    .single()

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  return NextResponse.json({ data })
}
