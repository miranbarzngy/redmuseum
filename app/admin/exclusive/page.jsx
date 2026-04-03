'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../../lib/supabase-client'
import Image from 'next/image'

const EMPTY_SLIDE = {
  title_ku: '', title_en: '', title_ar: '',
  event_date: '',
  description_ku: '', description_en: '', description_ar: '',
  link: '', phone: '', phone2: '',
  countdown_to: '',
  is_locked: false,
  is_active: true,
  sort_order: 0,
  image_url: ''
}

export default function ExclusiveAdmin() {
  const [masterActive, setMasterActive] = useState(false)
  const [masterEventId, setMasterEventId] = useState(null)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [formData, setFormData] = useState(EMPTY_SLIDE)
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchAll()
    const supabase = getSupabaseClient()
    if (!supabase) return
    const channel = supabase
      .channel('admin-exclusive-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exclusive_slides' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exclusive_events' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchAll = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    try {
      const { data: eventData } = await supabase
        .from('exclusive_events')
        .select('id, is_active')
        .limit(1)
        .maybeSingle()
      if (eventData) {
        setMasterActive(eventData.is_active)
        setMasterEventId(eventData.id)
      } else {
        // No record exists yet — create a default one with required fields
        const { data: newEvent } = await supabase
          .from('exclusive_events')
          .insert([{ title_ku: 'تایبەت', title_en: 'Exclusive', title_ar: 'حصري', is_active: false }])
          .select('id, is_active')
          .single()
        if (newEvent) {
          setMasterActive(newEvent.is_active)
          setMasterEventId(newEvent.id)
        }
      }

      const { data: slidesData, error } = await supabase
        .from('exclusive_slides')
        .select('*')
        .order('sort_order', { ascending: true })
      if (!error) setSlides(slidesData || [])
    } catch (err) {
      console.error('Error fetching exclusive data:', err.message || err)
    } finally {
      setLoading(false)
    }
  }

  const flash = (msg) => { setMessage(msg); setTimeout(() => setMessage(''), 3000) }

  const handleToggleMaster = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    if (!masterEventId) {
      flash('Still loading — please try again')
      fetchAll()
      return
    }
    const newStatus = !masterActive
    setMasterActive(newStatus)
    const { error } = await supabase
      .from('exclusive_events')
      .update({ is_active: newStatus })
      .eq('id', masterEventId)
    if (error) {
      setMasterActive(!newStatus)
      flash('Error updating master switch')
    } else {
      flash(`Exclusive tab ${newStatus ? 'activated' : 'deactivated'}`)
    }
  }

  const handleImageUpload = async () => {
    if (!imageFile) return null
    setUploading(true)
    try {
      const form = new FormData()
      form.append('file', imageFile)
      form.append('prefix', 'exclusive-')
      const res = await fetch('/api/upload', { method: 'POST', body: form })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Upload failed')
      return json.url
    } catch (err) {
      console.error('Upload error:', err.message || err)
      return null
    } finally {
      setUploading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase) { flash('Client not available'); return }

    let imageUrl = formData.image_url
    if (imageFile) {
      imageUrl = await handleImageUpload()
      if (!imageUrl) { flash('Image upload failed'); return }
    }

    const payload = { ...formData, image_url: imageUrl }
    delete payload.id

    try {
      if (editingSlide) {
        const { error } = await supabase.from('exclusive_slides').update(payload).eq('id', editingSlide.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('exclusive_slides').insert([payload])
        if (error) throw error
      }
      setShowModal(false)
      setEditingSlide(null)
      setFormData(EMPTY_SLIDE)
      setImageFile(null)
      flash(editingSlide ? 'Slide updated' : 'Slide created')
      fetchAll()
    } catch (err) {
      console.error('Save error:', err.message || err)
      flash('Error saving slide: ' + (err.message || 'unknown error'))
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this slide?')) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    const { error } = await supabase.from('exclusive_slides').delete().eq('id', id)
    if (!error) fetchAll()
    else flash('Error deleting slide')
  }

  const openModal = (slide = null) => {
    setEditingSlide(slide)
    setFormData(slide ? {
      title_ku: slide.title_ku || '',
      title_en: slide.title_en || '',
      title_ar: slide.title_ar || '',
      event_date: slide.event_date || '',
      description_ku: slide.description_ku || '',
      description_en: slide.description_en || '',
      description_ar: slide.description_ar || '',
      link: slide.link || '',
      phone: slide.phone || '',
      phone2: slide.phone2 || '',
      countdown_to: slide.countdown_to ? slide.countdown_to.slice(0, 16) : '',
      is_locked: slide.is_locked || false,
      is_active: slide.is_active !== false,
      sort_order: slide.sort_order || 0,
      image_url: slide.image_url || ''
    } : EMPTY_SLIDE)
    setImageFile(null)
    setShowModal(true)
  }

  const set = (field, value) => setFormData(p => ({ ...p, [field]: value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-red-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Exclusive Event Management</h1>

      {message && (
        <div className={`p-4 rounded-lg text-sm font-medium ${message.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {message}
        </div>
      )}

      {/* Master Switch */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold mb-1">Sidebar Tab Visibility</h2>
            <p className="text-sm text-gray-500">Show/hide the ⭐ Exclusive tab in the site sidebar (appears between Archive and Contact)</p>
          </div>
          <label className="flex items-center gap-3 cursor-pointer" onClick={handleToggleMaster}>
            <div className="relative">
              <div className={`block w-14 h-8 rounded-full transition-colors ${masterActive ? 'bg-red-600' : 'bg-gray-300'}`}></div>
              <div className={`absolute left-1 top-1 bg-white w-6 h-6 rounded-full shadow transition-transform ${masterActive ? 'translate-x-6' : ''}`}></div>
            </div>
            <span className="font-medium">{masterActive ? 'Active' : 'Inactive'}</span>
          </label>
        </div>
      </div>

      {/* Slides list */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold">Slides</h2>
        <button
          onClick={() => openModal()}
          className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 rounded-lg transition-colors"
        >
          + Add Slide
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Title</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Countdown To</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Lock</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {slides.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-gray-500">
                  No slides yet. Click &quot;+ Add Slide&quot; to get started.
                </td>
              </tr>
            )}
            {slides.map((slide) => (
              <tr key={slide.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  {slide.image_url ? (
                    <Image src={slide.image_url} alt={slide.title_en || ''} width={60} height={60} className="rounded object-cover" unoptimized />
                  ) : (
                    <div className="w-14 h-14 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">No img</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="font-medium text-sm">{slide.title_en || '—'}</div>
                  <div className="text-gray-500 text-xs">{slide.title_ku}</div>
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{slide.event_date || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">
                  {slide.countdown_to ? new Date(slide.countdown_to).toLocaleString() : '—'}
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${slide.is_locked ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-500'}`}>
                    {slide.is_locked ? '🔒 Locked' : 'Free'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${slide.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-700'}`}>
                    {slide.is_active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-4 py-3 space-x-3 text-sm whitespace-nowrap">
                  <button onClick={() => openModal(slide)} className="text-blue-600 hover:text-blue-800">Edit</button>
                  <button onClick={() => handleDelete(slide.id)} className="text-red-600 hover:text-red-800">Delete</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-start justify-center z-50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-bold mb-5">{editingSlide ? 'Edit Slide' : 'Add New Slide'}</h2>
            <form onSubmit={handleSubmit} className="space-y-5">

              {/* Image */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImageFile(e.target.files[0])}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                />
                {formData.image_url && (
                  <Image src={formData.image_url} alt="Current" width={80} height={80} className="mt-2 rounded object-cover" unoptimized />
                )}
              </div>

              {/* Titles */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <input placeholder="Kurdish" value={formData.title_ku} onChange={(e) => set('title_ku', e.target.value)}
                    dir="rtl" className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input placeholder="English" value={formData.title_en} onChange={(e) => set('title_en', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <input placeholder="Arabic" value={formData.title_ar} onChange={(e) => set('title_ar', e.target.value)}
                    dir="rtl" className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* Descriptions */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <textarea placeholder="Kurdish" rows={3} value={formData.description_ku} onChange={(e) => set('description_ku', e.target.value)}
                    dir="rtl" className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <textarea placeholder="English" rows={3} value={formData.description_en} onChange={(e) => set('description_en', e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                  <textarea placeholder="Arabic" rows={3} value={formData.description_ar} onChange={(e) => set('description_ar', e.target.value)}
                    dir="rtl" className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* Date & Countdown */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Event Date</label>
                  <input type="date" value={formData.event_date} onChange={(e) => set('event_date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Countdown To (date &amp; time)</label>
                  <input type="datetime-local" value={formData.countdown_to} onChange={(e) => set('countdown_to', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>

              {/* Phone, Phone2, Link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone</label>
                  <input type="text" value={formData.phone} onChange={(e) => set('phone', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Phone 2</label>
                  <input type="text" value={formData.phone2} onChange={(e) => set('phone2', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Link (optional)</label>
                <input type="url" value={formData.link} placeholder="https://" onChange={(e) => set('link', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              {/* Sort order */}
              <div className="w-32">
                <label className="block text-xs font-medium text-gray-700 mb-1">Sort Order</label>
                <input type="number" value={formData.sort_order} onChange={(e) => set('sort_order', parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
              </div>

              {/* Checkboxes */}
              <div className="flex gap-8">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_locked} onChange={(e) => set('is_locked', e.target.checked)}
                    className="h-4 w-4 accent-yellow-500" />
                  <span className="text-sm font-medium text-gray-700">🔒 Lock slide (disable auto-advance)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={formData.is_active} onChange={(e) => set('is_active', e.target.checked)}
                    className="h-4 w-4 accent-red-600" />
                  <span className="text-sm font-medium text-gray-700">Active</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm">
                  Cancel
                </button>
                <button type="submit" disabled={uploading}
                  className="px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 text-sm">
                  {uploading ? 'Uploading...' : editingSlide ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
