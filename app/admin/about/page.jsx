'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'

export default function AboutEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    id: 1,
    about_title_en: '',
    about_title_kr: '',
    about_text_en: '',
    about_text_kr: '',
    museums_count: 11,
    archives_count: 1900,
    visitors_count: 900,
    contact_phone: '',
    contact_email: '',
    contact_address_en: '',
    contact_address_kr: ''
  })

  useEffect(() => {
    fetchSettings()
  }, [])

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('*')
        .single()

      if (data) {
        setFormData({
          id: data.id,
          about_title_en: data.about_title_en || '',
          about_title_kr: data.about_title_kr || '',
          about_text_en: data.about_text_en || '',
          about_text_kr: data.about_text_kr || '',
          museums_count: data.museums_count || 11,
          archives_count: data.archives_count || 1900,
          visitors_count: data.visitors_count || 900,
          contact_phone: data.contact_phone || '',
          contact_email: data.contact_email || '',
          contact_address_en: data.contact_address_en || '',
          contact_address_kr: data.contact_address_kr || ''
        })
      }
    } catch (error) {
      console.log('No settings found, using defaults')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Use upsert to insert or update the record
      const { error } = await supabase
        .from('settings')
        .upsert([{
          id: formData.id,
          about_title_en: formData.about_title_en,
          about_title_kr: formData.about_title_kr,
          about_text_en: formData.about_text_en,
          about_text_kr: formData.about_text_kr,
          museums_count: formData.museums_count,
          archives_count: formData.archives_count,
          visitors_count: formData.visitors_count,
          contact_phone: formData.contact_phone,
          contact_email: formData.contact_email,
          contact_address_en: formData.contact_address_en,
          contact_address_kr: formData.contact_address_kr,
          updated_at: new Date().toISOString()
        }], { onConflict: 'id' })

      if (error) throw error

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      console.error('Error saving settings:', error)
      alert('Error saving settings: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
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
      <h1 className="text-3xl font-bold mb-6">About Section</h1>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* About Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">About Content</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (English)
              </label>
              <input
                type="text"
                name="about_title_en"
                value={formData.about_title_en}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title (Kurdish)
              </label>
              <input
                type="text"
                name="about_title_kr"
                value={formData.about_title_kr}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (English)
              </label>
              <textarea
                name="about_text_en"
                value={formData.about_text_en}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description (Kurdish)
              </label>
              <textarea
                name="about_text_kr"
                value={formData.about_text_kr}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Statistics</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Museums Count
              </label>
              <input
                type="number"
                name="museums_count"
                value={formData.museums_count}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Archives Count
              </label>
              <input
                type="number"
                name="archives_count"
                value={formData.archives_count}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Visitors (Yearly)
              </label>
              <input
                type="number"
                name="visitors_count"
                value={formData.visitors_count}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Contact Information</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone
              </label>
              <input
                type="text"
                name="contact_phone"
                value={formData.contact_phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                name="contact_email"
                value={formData.contact_email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (English)
              </label>
              <input
                type="text"
                name="contact_address_en"
                value={formData.contact_address_en}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address (Kurdish)
              </label>
              <input
                type="text"
                name="contact_address_kr"
                value={formData.contact_address_kr}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-4">
          {saved && (
            <span className="text-green-600 self-center">✓ Saved successfully!</span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:bg-gray-400"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  )
}
