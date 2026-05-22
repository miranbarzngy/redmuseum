'use client'

import { useEffect, useState } from 'react'
import {
  Landmark,
  BarChart3,
  Phone,
  Share2,
  Globe,
  Building2,
  Users,
  BookMarked,
  AtSign,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  Loader2,
  ThumbsUp,
  Camera,
  PlayCircle,
  Music2,
  Link as LinkIcon,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import VisibilityToggle from '../components/VisibilityToggle'

const SOCIAL_PLATFORMS = [
  { name: 'Facebook',  icon: 'ri-facebook-fill',  LIcon: ThumbsUp,    grad: 'from-blue-600 to-blue-800' },
  { name: 'Instagram', icon: 'ri-instagram-line',  LIcon: Camera,      grad: 'from-pink-500 to-rose-700' },
  { name: 'YouTube',   icon: 'ri-youtube-fill',    LIcon: PlayCircle,  grad: 'from-red-600 to-red-800' },
  { name: 'TikTok',    icon: 'ri-tiktok-fill',     LIcon: Music2,      grad: 'from-slate-700 to-slate-900' },
]

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
  { suffix: '_en', label: 'English', badge: 'bg-blue-100 text-blue-700',    dir: 'ltr', font: undefined },
  { suffix: '_kr', label: 'Kurdish', badge: 'bg-emerald-100 text-emerald-700', dir: 'rtl', font: 'UniSalar, Tahoma, sans-serif' },
  { suffix: '_ar', label: 'Arabic',  badge: 'bg-amber-100 text-amber-700',  dir: 'rtl', font: 'Cairo, Tahoma, sans-serif' },
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

export default function AboutEditor() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [formData, setFormData] = useState({
    id: 1,
    about_title_en: '', about_title_kr: '', about_title_ar: '',
    about_text_en: '',  about_text_kr: '',  about_text_ar: '',
    address_ar: '',
    museums_count: 11, archives_count: 1900, visitors_count: 900,
    contact_phone: '', contact_email: '',
    contact_address_en: '', contact_address_kr: '',
    social_json: [],
  })

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single()
      if (data) {
        setFormData({
          id: data.id,
          about_title_en: data.about_title_en || '',
          about_title_kr: data.about_title_kr || '',
          about_title_ar: data.about_title_ar || '',
          about_text_en:  data.about_text_en  || '',
          about_text_kr:  data.about_text_kr  || '',
          about_text_ar:  data.about_text_ar  || '',
          address_ar:          data.address_ar          || '',
          museums_count:       data.museums_count       || 11,
          archives_count:      data.archives_count      || 1900,
          visitors_count:      data.visitors_count      || 900,
          contact_phone:       data.contact_phone       || '',
          contact_email:       data.contact_email       || '',
          contact_address_en:  data.contact_address_en  || '',
          contact_address_kr:  data.contact_address_kr  || '',
          social_json:         data.social_json         || [],
        })
      }
    } catch { /* use defaults */ } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('settings').upsert([{
        ...formData, updated_at: new Date().toISOString(),
      }], { onConflict: 'id' })
      if (error) throw error
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (error) {
      alert('Error saving settings: ' + error.message)
    } finally { setSaving(false) }
  }

  const handleChange = (e) => {
    const { name, value, type } = e.target
    setFormData(prev => ({ ...prev, [name]: type === 'number' ? parseInt(value) || 0 : value }))
  }

  const addSocialLink = () => {
    setFormData(prev => ({
      ...prev,
      social_json: [...prev.social_json, { id: Date.now().toString(), platform_name: 'Facebook', url: '', icon_name: 'ri-facebook-fill' }],
    }))
  }

  const updateSocialLink = (id, field, value) => {
    setFormData(prev => ({
      ...prev,
      social_json: prev.social_json.map(l => l.id === id ? { ...l, [field]: value } : l),
    }))
  }

  const deleteSocialLink = (id) => {
    setFormData(prev => ({ ...prev, social_json: prev.social_json.filter(l => l.id !== id) }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statFields = [
    { name: 'museums_count',  label: 'Museums',         Icon: Building2,  grad: 'from-blue-700 to-blue-900',    shadow: 'shadow-blue-950/40' },
    { name: 'archives_count', label: 'Archive Items',   Icon: BookMarked, grad: 'from-stone-600 to-stone-800',  shadow: 'shadow-stone-950/40' },
    { name: 'visitors_count', label: 'Yearly Visitors', Icon: Users,      grad: 'from-indigo-600 to-indigo-800',shadow: 'shadow-indigo-950/40' },
  ]

  return (
    <div className="max-w-5xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-950/40">
          <Landmark size={20} strokeWidth={1.8} className="text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">About Section</h1>
          <p className="text-sm text-gray-400 mt-0.5">Museum info, statistics & contact details</p>
        </div>
      </div>

      <div className="mb-5">
        <VisibilityToggle settingKey="show_about" label="About Section" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* About Content */}
        <SectionCard icon={Landmark} title="About Content" grad="from-amber-600 to-amber-800" shadow="shadow-amber-950/40">
          {/* Language headers */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-5">
            {langCols.map(l => <LangBadge key={l.suffix} label={l.label} cls={l.badge} />)}
          </div>

          {/* Titles */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            {langCols.map(l => (
              <div key={l.suffix}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                <input
                  type="text"
                  name={`about_title${l.suffix}`}
                  value={formData[`about_title${l.suffix}`]}
                  onChange={handleChange}
                  dir={l.dir}
                  style={l.font ? { fontFamily: l.font } : {}}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          {/* Descriptions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {langCols.map(l => (
              <div key={l.suffix}>
                <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                <textarea
                  name={`about_text${l.suffix}`}
                  value={formData[`about_text${l.suffix}`]}
                  onChange={handleChange}
                  rows={5}
                  dir={l.dir}
                  style={l.font ? { fontFamily: l.font } : {}}
                  className={inputCls}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Statistics */}
        <SectionCard icon={BarChart3} title="Statistics" grad="from-slate-600 to-slate-800" shadow="shadow-slate-950/40">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {statFields.map(f => (
              <div key={f.name} className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                <div className="flex items-center gap-2.5 mb-3">
                  <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${f.grad} flex items-center justify-center shadow ${f.shadow}`}>
                    <f.Icon size={13} strokeWidth={2} className="text-white" />
                  </span>
                  <label className="text-xs font-semibold text-gray-600">{f.label}</label>
                </div>
                <input
                  type="number"
                  name={f.name}
                  value={formData[f.name]}
                  onChange={handleChange}
                  className={inputCls + ' text-2xl font-bold text-gray-800 text-center'}
                />
              </div>
            ))}
          </div>
        </SectionCard>

        {/* Contact Information */}
        <SectionCard icon={Phone} title="Contact Information" grad="from-teal-600 to-teal-900" shadow="shadow-teal-950/40">
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                  <Phone size={11} className="text-gray-400" /> Phone
                </label>
                <input type="text" name="contact_phone" value={formData.contact_phone} onChange={handleChange} className={inputCls} />
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5">
                  <AtSign size={11} className="text-gray-400" /> Email
                </label>
                <input type="email" name="contact_email" value={formData.contact_email} onChange={handleChange} className={inputCls} />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-2">
                <MapPin size={11} className="text-gray-400" /> Address
              </label>
              {/* Language headers for address */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
                {langCols.map(l => <LangBadge key={l.suffix} label={l.label} cls={l.badge} />)}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input type="text" name="contact_address_en" value={formData.contact_address_en} onChange={handleChange} className={inputCls} placeholder="English address" />
                <input type="text" name="contact_address_kr" value={formData.contact_address_kr} onChange={handleChange} dir="rtl" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }} className={inputCls} placeholder="Kurdish address" />
                <input type="text" name="address_ar" value={formData.address_ar} onChange={handleChange} dir="rtl" style={{ fontFamily: 'Cairo, Tahoma, sans-serif' }} className={inputCls} placeholder="Arabic address" />
              </div>
            </div>
          </div>
        </SectionCard>

        {/* Social Media */}
        <SectionCard icon={Share2} title="Social Media Links" grad="from-blue-700 to-blue-900" shadow="shadow-blue-950/40">
          <p className="text-xs text-gray-400 mb-4">Links shown in the Contact section of the public website.</p>

          <div className="space-y-3 mb-4">
            {formData.social_json.map(link => {
              const platform = SOCIAL_PLATFORMS.find(p => p.icon === link.icon_name) || SOCIAL_PLATFORMS[0]
              return (
                <div key={link.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${platform.grad} flex items-center justify-center shrink-0 shadow`}>
                    <platform.LIcon size={16} strokeWidth={1.8} className="text-white" />
                  </span>

                  <select
                    value={link.icon_name}
                    onChange={e => {
                      const p = SOCIAL_PLATFORMS.find(pl => pl.icon === e.target.value)
                      updateSocialLink(link.id, 'icon_name', e.target.value)
                      if (p) updateSocialLink(link.id, 'platform_name', p.name)
                    }}
                    className="px-3 py-2 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                  >
                    {SOCIAL_PLATFORMS.map(p => (
                      <option key={p.icon} value={p.icon}>{p.name}</option>
                    ))}
                  </select>

                  <div className="flex-1 relative">
                    <LinkIcon size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                      type="url"
                      value={link.url}
                      onChange={e => updateSocialLink(link.id, 'url', e.target.value)}
                      placeholder="https://..."
                      className="w-full pl-8 pr-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400"
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => deleteSocialLink(link.id)}
                    className="flex items-center justify-center w-9 h-9 text-red-500 hover:bg-red-50 rounded-xl transition-colors shrink-0"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              )
            })}
          </div>

          <button
            type="button"
            onClick={addSocialLink}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl transition-colors"
          >
            <Plus size={15} />
            Add Social Link
          </button>
        </SectionCard>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-1">
          {saved && (
            <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
              <CheckCircle2 size={15} /> Saved successfully
            </span>
          )}
          <button
            type="submit"
            disabled={saving}
            className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-br from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-amber-950/30 transition-all"
          >
            {saving
              ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
              : <><CheckCircle2 size={15} /> Save Changes</>
            }
          </button>
        </div>

      </form>
    </div>
  )
}
