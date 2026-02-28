'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { supabase } from '../../../lib/supabase-client'
import ImageUpload from '../../../components/ImageUpload'

export default function SlideForm() {
  const { id } = useParams()
  const router = useRouter()
  const isNew = id === 'new'
  
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    slide_number: 1,
    title: '',
    title_kr: '',
    subtitle: 'museum',
    subtitle_kr: 'مۆزەی',
    description: '',
    description_kr: '',
    background_image: '',
    museum_image: '',
    video_url: '',
    is_active: true
  })

  useEffect(() => {
    if (!isNew && id) {
      fetchSlide()
    }
  }, [id, isNew])

  const fetchSlide = async () => {
    try {
      const { data, error } = await supabase
        .from('slides')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      if (data) setFormData(data)
    } catch (error) {
      console.error('Error fetching slide:', error)
      alert('Error loading slide')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      if (isNew) {
        const { error } = await supabase
          .from('slides')
          .insert([formData])
        
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('slides')
          .update(formData)
          .eq('id', id)
        
        if (error) throw error
      }

      router.push('/admin/slides')
    } catch (error) {
      alert('Error saving slide: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-6">
        {isNew ? 'Add New Slide' : 'Edit Slide'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Slide Number */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Slide Number
          </label>
          <input
            type="number"
            name="slide_number"
            value={formData.slide_number}
            onChange={handleChange}
            min="1"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* English Fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (English)
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title (Kurdish)
            </label>
            <input
              type="text"
              name="title_kr"
              value={formData.title_kr}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Subtitle */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle (English)
            </label>
            <input
              type="text"
              name="subtitle"
              value={formData.subtitle}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Subtitle (Kurdish)
            </label>
            <input
              type="text"
              name="subtitle_kr"
              value={formData.subtitle_kr}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Description */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (English)
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Description (Kurdish)
            </label>
            <textarea
              name="description_kr"
              value={formData.description_kr}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Image Upload - Background */}
        <ImageUpload
          label="Background Image"
          value={formData.background_image}
          onChange={(url) => setFormData(prev => ({ ...prev, background_image: url }))}
          folder="slides"
        />

        {/* Image Upload - Museum */}
        <ImageUpload
          label="Museum Image"
          value={formData.museum_image}
          onChange={(url) => setFormData(prev => ({ ...prev, museum_image: url }))}
          folder="museum"
        />

        {/* Video URL */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Video URL
          </label>
          <input
            type="text"
            name="video_url"
            value={formData.video_url}
            onChange={handleChange}
            placeholder="/assets/videos/peshmarga.mp4"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Active Status */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            name="is_active"
            id="is_active"
            checked={formData.is_active}
            onChange={handleChange}
            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
          />
          <label htmlFor="is_active" className="text-sm font-medium text-gray-700">
            Active (show on website)
          </label>
        </div>

        {/* Submit Buttons */}
        <div className="flex justify-end gap-4 pt-4">
          <button
            type="button"
            onClick={() => router.push('/admin/slides')}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : isNew ? 'Create Slide' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
