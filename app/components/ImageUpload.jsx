'use client'

import { useState, useRef } from 'react'
import { Upload, Trash2, Loader2, ImageIcon } from 'lucide-react'
import { supabase } from '../lib/supabase-client'

export default function ImageUpload({
  label,
  value,
  onChange,
  folder = 'slides',
  accept = 'image/*',
}) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState(value)
  const fileInputRef = useRef(null)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setPreview(URL.createObjectURL(file))
    await uploadFile(file)
  }

  const uploadFile = async (file) => {
    if (!supabase) { alert('Supabase not configured'); return }
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      const { data, error } = await supabase.storage
        .from('museum-images')
        .upload(filePath, file)
      if (error) throw error

      const { data: urlData } = supabase.storage
        .from('museum-images')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      await supabase.from('images').insert({ filename: fileName, path: filePath, url: publicUrl, folder })
      onChange(publicUrl)
      setPreview(publicUrl)
    } catch (error) {
      console.error('Upload error:', error)
      alert('Failed to upload image')
    } finally {
      setUploading(false)
    }
  }

  const handleRemove = async () => {
    if (!value) return
    try {
      const path = value.split('/storage/v1/object/public/museum-images/')?.[1]
      if (path) await supabase.storage.from('museum-images').remove([path])
      onChange('')
      setPreview('')
    } catch (error) {
      console.error('Remove error:', error)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => { onChange(e.target.value); setPreview(e.target.value) }}
          placeholder="/assets/images/bg-1.jpg"
          className="flex-1 px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 bg-gray-50/50"
        />

        <input type="file" ref={fileInputRef} accept={accept} onChange={handleFileChange} className="hidden" />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-blue-600 to-blue-800 text-white text-sm font-medium rounded-xl hover:from-blue-700 hover:to-blue-900 disabled:opacity-60 transition-all shadow-md shadow-blue-900/30 shrink-0"
        >
          {uploading
            ? <><Loader2 size={15} className="animate-spin" /> Uploading…</>
            : <><Upload size={15} /> Upload</>
          }
        </button>

        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-red-600 to-red-800 text-white rounded-xl hover:from-red-700 hover:to-red-900 transition-all shadow-md shadow-red-900/30 shrink-0"
            title="Remove image"
          >
            <Trash2 size={15} />
          </button>
        )}
      </div>

      {(preview || value) ? (
        <div className="relative inline-block">
          <img
            src={preview || value}
            alt="Preview"
            className="h-24 w-auto rounded-xl border border-gray-200 object-cover shadow-sm"
            onError={() => setPreview('')}
          />
        </div>
      ) : (
        <div className="flex items-center gap-2 h-16 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
          <ImageIcon size={16} />
          <span>No image selected</span>
        </div>
      )}
    </div>
  )
}
