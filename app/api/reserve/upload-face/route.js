import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const MAX_BYTES = 2 * 1024 * 1024  // 2 MB max for face captures

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey  = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server storage not configured' }, { status: 500 })
  }

  let formData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const file = formData.get('face')
  if (!file || typeof file === 'string') {
    return NextResponse.json({ error: 'No face image provided' }, { status: 400 })
  }

  // Only accept JPEG (canvas toDataURL output)
  if (file.type !== 'image/jpeg') {
    return NextResponse.json({ error: 'Only JPEG images are accepted' }, { status: 400 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image too large (max 2 MB)' }, { status: 400 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const fileName = `faces/face_${Date.now()}_${Math.random().toString(36).slice(2, 9)}.jpg`
  const buffer   = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from('museum-images')
    .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: false })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data } = supabase.storage.from('museum-images').getPublicUrl(fileName)
  return NextResponse.json({ url: data.publicUrl })
}
