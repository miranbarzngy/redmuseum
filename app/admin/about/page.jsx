'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'

// Available social platforms with their icon class names (Remix Icon)
const SOCIAL_PLATFORMS = [
  { name: 'Facebook', icon: 'ri-facebook-fill' },
  { name: 'Instagram', icon: 'ri-instagram-line' },
  { name: 'YouTube', icon: 'ri-youtube-fill' },
  { name: 'TikTok', icon: 'ri-tiktok-fill' },
]

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
    contact_address_kr: '',
    social_json: []
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
          contact_address_kr: data.contact_address_kr || '',
          social_json: data.social_json || []
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
          social_json: formData.social_json,
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

  const addSocialLink = () => {
    const newLink = {
      id: Date.now().toString(),
      platform_name: 'Facebook',
      url: '',
      icon_name: 'ri-facebook-fill'
    }
    setFormData(prev => ({
      ...prev,
      social_json: [...prev.social_json, newLink]
    }))
  }

  const updateSocialLink = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      social_json: prev.social_json.map(link => 
        link.id === id ? { ...link, [field]: value } : link
      )
    }))
  }

  const deleteSocialLink = (id) => {
    setFormData(prev => ({
      ...prev,
      social_json: prev.social_json.filter(link => link.id !== id)
    }))
  }

  const getIconClass = (iconName) => {
    const platform = SOCIAL_PLATFORMS.find(p => p.icon === iconName)
    return platform ? platform.icon : 'ri-links-line'
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
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                Title (Kurdish / کوردی)
              </label>
              <input
                type="text"
                name="about_title_kr"
                value={formData.about_title_kr}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}
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
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                Description (Kurdish / کوردی)
              </label>
              <textarea
                name="about_text_kr"
                value={formData.about_text_kr}
                onChange={handleChange}
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}
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
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <i className="ri-phone-line"></i>
            Contact Information
          </h2>
          
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
              <label className="block text-sm font-medium text-gray-700 mb-1" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                Address (Kurdish / کوردی)
              </label>
              <input
                type="text"
                name="contact_address_kr"
                value={formData.contact_address_kr}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}
              />
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
            <i className="ri-share-forward-line"></i>
            Social Media Links
          </h2>
          
          <p className="text-sm text-gray-500 mb-4">
            Add your social media links to display on the contact section of the website.
          </p>

          <div className="space-y-4 mb-4">
            {formData.social_json.map((link) => {
              const iconClass = getIconClass(link.icon_name)
              return (
                <div key={link.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 flex items-center justify-center bg-blue-100 rounded-full">
                    <i className={`${iconClass} text-blue-600 text-xl`}></i>
                  </div>
                  
                  <select
                    value={link.icon_name}
                    onChange={(e) => updateSocialLink(link.id, 'icon_name', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {SOCIAL_PLATFORMS.map(platform => (
                      <option key={platform.icon} value={platform.icon}>
                        {platform.name}
                      </option>
                    ))}
                  </select>
                  
                  <input
                    type="url"
                    value={link.url}
                    onChange={(e) => updateSocialLink(link.id, 'url', e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    type="button"
                    onClick={() => deleteSocialLink(link.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <i className="ri-delete-bin-line text-xl"></i>
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={addSocialLink}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            <i className="ri-add-line"></i>
            Add Social Link
          </button>
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
