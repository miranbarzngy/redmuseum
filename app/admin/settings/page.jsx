'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase-client'
import { logAudit } from '../../lib/auditLog'
import {
  Settings, Phone, Mail, MapPin, Globe, CheckCircle2,
  Loader2, Plus, Trash2, Save, Building2,
} from 'lucide-react'

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400/40 focus:border-indigo-400 bg-gray-50/50 transition-colors'

const SOCIAL_ICONS = [
  { label: 'Facebook',  value: 'ri-facebook-fill'    },
  { label: 'Instagram', value: 'ri-instagram-line'    },
  { label: 'TikTok',    value: 'ri-tiktok-fill'       },
  { label: 'YouTube',   value: 'ri-youtube-fill'      },
  { label: 'Twitter/X', value: 'ri-twitter-x-fill'    },
  { label: 'WhatsApp',  value: 'ri-whatsapp-fill'     },
  { label: 'Telegram',  value: 'ri-telegram-fill'     },
  { label: 'LinkedIn',  value: 'ri-linkedin-fill'     },
  { label: 'Link',      value: 'ri-links-line'        },
]

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100">
        <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center shadow shadow-indigo-950/40">
          <Icon size={15} className="text-white" />
        </span>
        <h2 className="font-semibold text-gray-800">{title}</h2>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">{label}</label>
      {children}
    </div>
  )
}

export default function MuseumSettingsPage() {
  const [loading, setLoading]   = useState(true)
  const [saving,  setSaving]    = useState(false)
  const [saved,   setSaved]     = useState(false)
  const [settingsId, setSettingsId] = useState(null)

  // Museum names
  const [nameKr, setNameKr] = useState('')
  const [nameEn, setNameEn] = useState('')
  const [nameAr, setNameAr] = useState('')

  // Contact info
  const [phone,    setPhone]    = useState('')
  const [email,    setEmail]    = useState('')
  const [addrKr,   setAddrKr]   = useState('')
  const [addrEn,   setAddrEn]   = useState('')
  const [addrAr,   setAddrAr]   = useState('')

  // Social links
  const [socials, setSocials] = useState([])

  useEffect(() => { loadSettings() }, [])

  const loadSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single()
      if (data) {
        setSettingsId(data.id)
        setNameKr(data.museum_name_kr || '')
        setNameEn(data.museum_name_en || '')
        setNameAr(data.museum_name_ar || '')
        setPhone(data.contact_phone || '')
        setEmail(data.contact_email || '')
        setAddrKr(data.contact_address_kr || '')
        setAddrEn(data.contact_address_en || '')
        setAddrAr(data.address_ar || '')
        setSocials(Array.isArray(data.social_json) ? data.social_json : [])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const updates = {
        museum_name_kr: nameKr.trim(),
        museum_name_en: nameEn.trim(),
        museum_name_ar: nameAr.trim(),
        contact_phone:  phone.trim(),
        contact_email:  email.trim(),
        contact_address_kr: addrKr.trim(),
        contact_address_en: addrEn.trim(),
        address_ar:     addrAr.trim(),
        social_json:    socials.filter(s => s.url?.trim()),
        updated_at:     new Date().toISOString(),
      }
      const { error } = settingsId
        ? await supabase.from('settings').update(updates).eq('id', settingsId)
        : await supabase.from('settings').insert([updates])
      if (error) throw error
      logAudit('update', 'settings', 'museum_settings', { museum_name: nameEn.trim() })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (e) {
      alert('Error saving: ' + e.message)
    } finally {
      setSaving(false)
    }
  }

  const addSocial = () =>
    setSocials(s => [...s, { id: Date.now(), platform_name: '', url: '', icon_name: 'ri-links-line' }])

  const updateSocial = (idx, key, val) =>
    setSocials(s => s.map((item, i) => i === idx ? { ...item, [key]: val } : item))

  const removeSocial = (idx) =>
    setSocials(s => s.filter((_, i) => i !== idx))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-3xl space-y-6 pt-4 sm:pt-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-indigo-950/40 shrink-0">
            <Settings size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Museum Settings</h1>
            <p className="text-sm text-gray-400 mt-0.5">Museum name, contact info &amp; social links</p>
          </div>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-indigo-600 to-indigo-900 hover:from-indigo-700 hover:to-indigo-950 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-indigo-950/30 transition-all"
        >
          {saving
            ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
            : saved
            ? <><CheckCircle2 size={15} /> Saved!</>
            : <><Save size={15} /> Save Changes</>
          }
        </button>
      </div>

      {/* Museum Names */}
      <Section icon={Building2} title="Museum Name">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Field label="Kurdish (Sorani)">
            <input dir="rtl" value={nameKr} onChange={e => setNameKr(e.target.value)} className={inputCls} placeholder="ناوی مۆزەخانە" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }} />
          </Field>
          <Field label="English">
            <input value={nameEn} onChange={e => setNameEn(e.target.value)} className={inputCls} placeholder="Museum Name" />
          </Field>
          <Field label="Arabic">
            <input dir="rtl" value={nameAr} onChange={e => setNameAr(e.target.value)} className={inputCls} placeholder="اسم المتحف" />
          </Field>
        </div>
      </Section>

      {/* Contact Info */}
      <Section icon={Phone} title="Contact Information">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Phone Number">
              <div className="relative">
                <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} className={inputCls + ' pl-8'} placeholder="+964 0770 000000" />
              </div>
            </Field>
            <Field label="Email Address">
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input dir="ltr" value={email} onChange={e => setEmail(e.target.value)} className={inputCls + ' pl-8'} placeholder="info@amnasuraka.com" type="email" />
              </div>
            </Field>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field label="Address (Kurdish)">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <textarea dir="rtl" rows={2} value={addrKr} onChange={e => setAddrKr(e.target.value)} className={inputCls + ' pl-8 resize-none'} placeholder="ناونیشان بەکوردی" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }} />
              </div>
            </Field>
            <Field label="Address (English)">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <textarea rows={2} value={addrEn} onChange={e => setAddrEn(e.target.value)} className={inputCls + ' pl-8 resize-none'} placeholder="Address in English" />
              </div>
            </Field>
            <Field label="Address (Arabic)">
              <div className="relative">
                <MapPin size={14} className="absolute left-3 top-3 text-gray-400" />
                <textarea dir="rtl" rows={2} value={addrAr} onChange={e => setAddrAr(e.target.value)} className={inputCls + ' pl-8 resize-none'} placeholder="العنوان بالعربية" />
              </div>
            </Field>
          </div>
        </div>
      </Section>

      {/* Social Links */}
      <Section icon={Globe} title="Social Media Links">
        <div className="space-y-3">
          {socials.map((s, i) => (
            <div key={s.id ?? i} className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
              <select
                value={s.icon_name}
                onChange={e => {
                  const opt = SOCIAL_ICONS.find(o => o.value === e.target.value)
                  updateSocial(i, 'icon_name', e.target.value)
                  if (opt) updateSocial(i, 'platform_name', opt.label)
                }}
                className="w-36 shrink-0 px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-indigo-400/40"
              >
                {SOCIAL_ICONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <input
                value={s.url}
                onChange={e => updateSocial(i, 'url', e.target.value)}
                className={inputCls + ' flex-1'}
                placeholder="https://"
                dir="ltr"
              />
              <div className="flex items-center gap-1.5">
                {s.icon_name && (
                  <span className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
                    <i className={`${s.icon_name} text-base text-gray-500`} />
                  </span>
                )}
                <button
                  onClick={() => removeSocial(i)}
                  className="w-9 h-9 rounded-lg bg-red-50 hover:bg-red-100 text-red-500 flex items-center justify-center transition-colors shrink-0"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          <button
            onClick={addSocial}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors"
          >
            <Plus size={14} />
            Add Social Link
          </button>
        </div>
      </Section>

      {/* Bottom save */}
      <div className="flex justify-end pb-6">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 px-6 py-3 text-sm font-semibold bg-gradient-to-br from-indigo-600 to-indigo-900 hover:from-indigo-700 hover:to-indigo-950 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-indigo-950/30 transition-all"
        >
          {saving
            ? <><Loader2 size={15} className="animate-spin" /> Saving…</>
            : saved
            ? <><CheckCircle2 size={15} /> Saved!</>
            : <><Save size={15} /> Save Changes</>
          }
        </button>
      </div>

    </div>
  )
}
