'use client'

import { useState, useRef } from 'react'
import { supabase } from '../lib/supabase-client'

export default function ImageUpload({ 
  label, 
  value, 
  onChange, 
  folder = 'slides',
  accept = "image/*"
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
    if (!supabase) {
      alert('Supabase not configured')
      return
    }

    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${fileExt}`
      const filePath = `${folder}/${fileName}`

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('museum-images')
        .upload(filePath, file)

      if (error) throw error

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('museum-images')
        .getPublicUrl(filePath)

      const publicUrl = urlData.publicUrl
      
      // Add to images table for tracking
      await supabase.from('images').insert({
        filename: fileName,
        path: filePath,
        url: publicUrl,
        folder: folder
      })

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
      // Extract path from URL
      const path = value.split('/storage/v1/object/public/museum-images/')?.[1]
      if (path) {
        await supabase.storage.from('museum-images').remove([path])
      }
      onChange('')
      setPreview('')
    } catch (error) {
      console.error('Remove error:', error)
    }
  }

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            onChange(e.target.value)
            setPreview(e.target.value)
          }}
          placeholder="/assets/images/bg-1.jpg"
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        
        <input
          type="file"
          ref={fileInputRef}
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
        
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
        >
          {uploading ? 'Uploading...' : '📤 Upload'}
        </button>

        {value && (
          <button
            type="button"
            onClick={handleRemove}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            🗑️
          </button>
        )}
      </div>

      {/* Preview */}
      {(preview || value) && (
        <div className="mt-2 relative inline-block">
          <img
            src={preview || value}
            alt="Preview"
            className="h-20 w-auto rounded border"
            onError={() => setPreview('')}
          />
        </div>
      )}
    </div>
  )
}
