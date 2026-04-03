import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

export async function POST(request) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // Server-side: prefer non-public service key, fall back to the NEXT_PUBLIC variant
  const serviceKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server storage not configured' }, { status: 500 })
  }

  // Service-role client bypasses RLS entirely
  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false }
  })

  const formData = await request.formData()
  const file = formData.get('file')
  const bucket = formData.get('bucket') || 'activities'
  const prefix = formData.get('prefix') || ''

  if (!file) {
    return NextResponse.json({ error: 'No file provided' }, { status: 400 })
  }

  const fileExt = file.name.split('.').pop()
  const fileName = `${prefix}${Date.now()}.${fileExt}`
  const buffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType: file.type })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 })
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return NextResponse.json({ url: data.publicUrl })
}
