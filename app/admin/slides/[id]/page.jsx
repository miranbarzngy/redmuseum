'use client'

import { useEffect, useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import {
  ArrowLeft,
  Type,
  ImageIcon,
  Video,
  Settings2,
  Globe,
  CheckCircle2,
  Loader2,
} from 'lucide-react'
import { supabase } from '../../../lib/supabase-client'
import { logAudit } from '../../../lib/auditLog'
import ImageUpload from '../../../components/ImageUpload'

function SectionCard({ icon: Icon, title, grad, shadow, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow ${shadow}`}>
          <Icon size={15} strokeWidth={2} className="text-white" />
        </span>
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

const langCols = [
  { key: '',     label: 'English', badge: 'bg-blue-100 text-blue-700',   dir: 'ltr', font: undefined },
  { key: '_kr',  label: 'Kurdish', badge: 'bg-emerald-100 text-emerald-700', dir: 'ltr', font: undefined },
  { key: '_ar',  label: 'Arabic',  badge: 'bg-amber-100 text-amber-700', dir: 'rtl', font: 'Cairo, Tahoma, sans-serif' },
]

function LangBadge({ label, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Globe size={11} />
      {label}
    </span>
  )
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 bg-gray-50/50 transition-colors'

export default function SlideForm() {
  const { id } = useParams()
  const router = useRouter()
  const isNew = id === 'new'

  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    title_kr: '',
    title_ar: '',
    subtitle: 'museum',
    subtitle_kr: 'مۆزەی',
    subtitle_ar: 'متحف',
    description: '',
    description_kr: '',
    description_ar: '',
    background_image: '',
    museum_image: '',
    video_url: '',
    is_active: true,
  })

  useEffect(() => {
    if (!isNew && id) fetchSlide()
  }, [id, isNew])

  const fetchSlide = async () => {
    try {
      const { data, error } = await supabase.from('slides').select('*').eq('id', id).single()
      if (error) throw error
      if (data) {
        setFormData({
          ...data,
          title_ar: data.title_ar || '',
          subtitle_ar: data.subtitle_ar || 'متحف',
          description_ar: data.description_ar || '',
        })
      }
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
        const { count } = await supabase.from('slides').select('*', { count: 'exact', head: true })
        const { error } = await supabase.from('slides').insert([{ ...formData, slide_number: (count || 0) + 1 }])
        if (error) throw error
      } else {
        const { error } = await supabase.from('slides').update(formData).eq('id', id)
        if (error) throw error
      }
      logAudit(isNew ? 'create' : 'update', 'slides', isNew ? 'new' : String(id), { title: formData.title })
      router.push('/admin/slides')
    } catch (error) {
      alert('Error saving slide: ' + error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <button
          type="button"
          onClick={() => router.push('/admin/slides')}
          className="flex items-center justify-center w-9 h-9 rounded-xl border border-gray-200 hover:bg-gray-100 transition-colors text-gray-500"
        >
          <ArrowLeft size={17} />
        </button>
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-0.5">Slides</p>
          <h1 className="text-2xl font-bold text-gray-900">{isNew ? 'Add New Slide' : 'Edit Slide'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* Content Section */}
        <SectionCard icon={Type} title="Content" grad="from-blue-700 to-blue-900" shadow="shadow-blue-950/40">
          {/* Language column headers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {langCols.map(l => (
              <LangBadge key={l.key} label={l.label} cls={l.badge} />
            ))}
          </div>

          {/* Title */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {langCols.map(l => (
              <div key={l.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                <input
                  type="text"
                  name={`title${l.key}`}
                  value={formData[`title${l.key}`]}
                  onChange={handleChange}
                  required={l.key === ''}
                  dir={l.dir}
                  style={l.font ? { fontFamily: l.font } : {}}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          {/* Subtitle */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {langCols.map(l => (
              <div key={l.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Subtitle</label>
                <input
                  type="text"
                  name={`subtitle${l.key}`}
                  value={formData[`subtitle${l.key}`]}
                  onChange={handleChange}
                  dir={l.dir}
                  style={l.font ? { fontFamily: l.font } : {}}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          {/* Description */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {langCols.map(l => (
              <div key={l.key}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea
                  name={`description${l.key}`}
                  value={formData[`description${l.key}`]}
                  onChange={handleChange}
                  rows={3}
                  dir={l.dir}
                  style={l.font ? { fontFamily: l.font } : {}}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Media Section */}
        <SectionCard icon={ImageIcon} title="Media" grad="from-rose-700 to-rose-900" shadow="shadow-rose-950/40">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Background Image</label>
              <ImageUpload
                label=""
                value={formData.background_image}
                onChange={(url) => setFormData(prev => ({ ...prev, background_image: url }))}
                folder="slides"
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2">Museum Image</label>
              <ImageUpload
                label=""
                value={formData.museum_image}
                onChange={(url) => setFormData(prev => ({ ...prev, museum_image: url }))}
                folder="museum"
              />
            </div>

            <div className="border-t border-gray-100 pt-5">
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Video size={15} className="text-gray-400" />
                Video URL
              </label>
              <input
                type="text"
                name="video_url"
                value={formData.video_url}
                onChange={handleChange}
                placeholder="/assets/videos/peshmarga.mp4"
                className={inputCls}
              />
            </div>
          </div>
        </SectionCard>

        {/* Settings Section */}
        <SectionCard icon={Settings2} title="Settings" grad="from-slate-600 to-slate-800" shadow="shadow-slate-950/40">
          <label className="flex items-center gap-3 cursor-pointer group w-fit">
            <div className="relative">
              <input
                type="checkbox"
                name="is_active"
                id="is_active"
                checked={formData.is_active}
                onChange={handleChange}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 rounded-full peer peer-checked:bg-blue-600 transition-colors" />
              <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform peer-checked:translate-x-5" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">Active</p>
              <p className="text-xs text-gray-400">Show this slide on the website</p>
            </div>
          </label>
        </SectionCard>

        {/* Action Buttons */}
        <div className="flex justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={() => router.push('/admin/slides')}
            className="px-5 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors text-gray-700"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white rounded-xl disabled:opacity-60 transition-all shadow-lg shadow-blue-900/30"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : <><CheckCircle2 size={15} /> {isNew ? 'Create Slide' : 'Save Changes'}</>
            }
          </button>
        </div>

      </form>
    </div>
  )
}
