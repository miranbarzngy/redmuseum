import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import { getSessionUser } from '../../lib/api-auth'

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const MAX_BYTES = 10 * 1024 * 1024 // 10 MB
const ALLOWED_BUCKETS = new Set(['activities', 'museum-images', 'gallery', 'slides', 'exclusive', 'showcase'])

export async function POST(request) {
  if (!await getSessionUser(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Server storage not configured' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey, { auth: { persistSession: false } })

  const formData = await request.formData()
  const file = formData.get('file')
  const bucket = formData.get('bucket') || 'activities'
  const prefix = formData.get('prefix') || ''

  if (!file) return NextResponse.json({ error: 'No file provided' }, { status: 400 })

  // Validate bucket name against allowlist
  if (!ALLOWED_BUCKETS.has(bucket)) {
    return NextResponse.json({ error: 'Invalid bucket' }, { status: 400 })
  }

  // Validate MIME type
  if (!ALLOWED_MIME.has(file.type)) {
    return NextResponse.json({ error: 'Only image files are allowed (jpeg, png, webp, gif, avif)' }, { status: 400 })
  }

  // Validate file size
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 10 MB)' }, { status: 400 })
  }

  // Sanitise prefix — strip anything that isn't alphanumeric, hyphens, or underscores
  const safePrefix = prefix.replace(/[^a-zA-Z0-9_-]/g, '')

  // Derive extension from allowed MIME type, not from user-supplied filename
  const EXT_MAP = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif', 'image/avif': 'avif' }
  const fileExt = EXT_MAP[file.type]
  const fileName = `${safePrefix}${Date.now()}.${fileExt}`

  const buffer = await file.arrayBuffer()

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, buffer, { contentType: file.type })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return NextResponse.json({ url: data.publicUrl })
}
