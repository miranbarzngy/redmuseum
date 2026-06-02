'use client'

import { useEffect, useState } from 'react'
import {
  Landmark,
  BarChart3,
  Globe,
  Building2,
  Users,
  BookMarked,
  CheckCircle2,
  Loader2,
  Palette,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import VisibilityToggle from '../components/VisibilityToggle'
import { logAudit } from '../../lib/auditLog'

function SectionCard({ icon: Icon, title, grad, shadow, children, collapsible, open, onToggle }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div
        className={`flex items-center gap-3 px-6 py-4 border-b border-gray-100 ${collapsible ? 'cursor-pointer select-none' : ''}`}
        onClick={collapsible ? onToggle : undefined}
      >
        <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${grad} flex items-center justify-center shadow ${shadow}`}>
          <Icon size={15} strokeWidth={2} className="text-white" />
        </span>
        <h2 className="font-semibold text-gray-800">{title}</h2>
        {collapsible && <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />}
      </div>
      {(!collapsible || open) && <div className="p-6">{children}</div>}
    </div>
  )
}

const langCols = [
  { suffix: '_en', label: 'English', badge: 'bg-blue-100 text-blue-700',       dir: 'ltr', font: undefined },
  { suffix: '_kr', label: 'Kurdish', badge: 'bg-emerald-100 text-emerald-700', dir: 'rtl', font: 'UniSalar, Tahoma, sans-serif' },
  { suffix: '_ar', label: 'Arabic',  badge: 'bg-amber-100 text-amber-700',     dir: 'rtl', font: 'Cairo, Tahoma, sans-serif' },
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
  const [loading, setLoading]             = useState(true)
  const [saving,  setSaving]              = useState(false)
  const [saved,   setSaved]               = useState(false)
  const [appearanceOpen, setAppearanceOpen] = useState(false)
  const [bgMode,     setBgMode]           = useState('solid')
  const [gradColor1, setGradColor1]       = useState('#7a0000')
  const [gradColor2, setGradColor2]       = useState('#ffffff')
  const [gradAngle,  setGradAngle]        = useState(135)
  const [formData, setFormData] = useState({
    id: 1,
    about_title_en: '', about_title_kr: '', about_title_ar: '',
    about_text_en:  '', about_text_kr:  '', about_text_ar:  '',
    museums_count:  11, archives_count: 1900, visitors_count: 900,
    about_bg_color: '#ffffff',
  })

  useEffect(() => { fetchSettings() }, [])

  const fetchSettings = async () => {
    try {
      const { data } = await supabase.from('settings').select('*').single()
      if (data) {
        setFormData({
          id:             data.id,
          about_title_en: data.about_title_en || '',
          about_title_kr: data.about_title_kr || '',
          about_title_ar: data.about_title_ar || '',
          about_text_en:  data.about_text_en  || '',
          about_text_kr:  data.about_text_kr  || '',
          about_text_ar:  data.about_text_ar  || '',
          museums_count:  data.museums_count  || 11,
          archives_count: data.archives_count || 1900,
          visitors_count: data.visitors_count || 900,
          about_bg_color: data.about_bg_color || '#ffffff',
        })
        const bgVal = data.about_bg_color || '#ffffff'
        if (bgVal.startsWith('linear-gradient')) {
          const m = bgVal.match(/linear-gradient\((\d+)deg,\s*([^,]+),\s*([^)]+)\)/)
          if (m) {
            setBgMode('gradient')
            setGradAngle(parseInt(m[1]))
            setGradColor1(m[2].trim())
            setGradColor2(m[3].trim())
          }
        }
      }
    } catch { /* use defaults */ } finally { setLoading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const { error } = await supabase.from('settings').upsert(
        [{ ...formData, updated_at: new Date().toISOString() }],
        { onConflict: 'id' }
      )
      if (error) throw error
      logAudit('update', 'settings', 'about', { title: formData.about_title_en })
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const statFields = [
    { name: 'museums_count',  label: 'Museums',         Icon: Building2,  grad: 'from-blue-700 to-blue-900',     shadow: 'shadow-blue-950/40' },
    { name: 'archives_count', label: 'Archive Items',   Icon: BookMarked, grad: 'from-stone-600 to-stone-800',   shadow: 'shadow-stone-950/40' },
    { name: 'visitors_count', label: 'Yearly Visitors', Icon: Users,      grad: 'from-indigo-600 to-indigo-800', shadow: 'shadow-indigo-950/40' },
  ]

  return (
    <div className="max-w-5xl pt-4 sm:pt-6">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-950/40 shrink-0">
          <Landmark size={20} strokeWidth={1.8} className="text-white" />
        </span>
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">About Section</h1>
          <p className="text-sm text-gray-400 mt-0.5">About content, appearance &amp; statistics</p>
        </div>
      </div>

      <div className="mb-5">
        <VisibilityToggle settingKey="show_about" label="About Section" />
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">

        {/* About Content */}
        <SectionCard icon={Landmark} title="About Content" grad="from-amber-600 to-amber-800" shadow="shadow-amber-950/40">
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

        {/* Appearance */}
        <SectionCard
          icon={Palette} title="Appearance"
          grad="from-purple-600 to-purple-900" shadow="shadow-purple-950/40"
          collapsible open={appearanceOpen} onToggle={() => setAppearanceOpen(o => !o)}
        >
          <div className="flex items-center gap-2 mb-5">
            {['solid', 'gradient'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setBgMode(mode)
                  if (mode === 'solid') {
                    setFormData(p => ({ ...p, about_bg_color: '#ffffff' }))
                  } else {
                    setFormData(p => ({ ...p, about_bg_color: `linear-gradient(${gradAngle}deg, ${gradColor1}, ${gradColor2})` }))
                  }
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  bgMode === mode ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {mode === 'solid' ? '⬛ Solid' : '🌈 Gradient'}
              </button>
            ))}
          </div>

          {bgMode === 'solid' ? (
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={formData.about_bg_color.startsWith('linear') ? '#ffffff' : formData.about_bg_color}
                onChange={e => setFormData(p => ({ ...p, about_bg_color: e.target.value }))}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={formData.about_bg_color.startsWith('linear') ? '#ffffff' : formData.about_bg_color}
                onChange={e => setFormData(p => ({ ...p, about_bg_color: e.target.value }))}
                placeholder="#ffffff"
                className={inputCls + ' w-32 font-mono'}
              />
              <button
                type="button"
                onClick={() => setFormData(p => ({ ...p, about_bg_color: '#ffffff' }))}
                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Color 1 (Start)', val: gradColor1, set: setGradColor1 },
                  { label: 'Color 2 (End)',   val: gradColor2, set: setGradColor2 },
                ].map(({ label, val, set }) => (
                  <div key={label}>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val}
                        onChange={e => {
                          set(e.target.value)
                          const c1 = label.includes('1') ? e.target.value : gradColor1
                          const c2 = label.includes('2') ? e.target.value : gradColor2
                          setFormData(p => ({ ...p, about_bg_color: `linear-gradient(${gradAngle}deg, ${c1}, ${c2})` }))
                        }}
                        className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={e => {
                          set(e.target.value)
                          const c1 = label.includes('1') ? e.target.value : gradColor1
                          const c2 = label.includes('2') ? e.target.value : gradColor2
                          setFormData(p => ({ ...p, about_bg_color: `linear-gradient(${gradAngle}deg, ${c1}, ${c2})` }))
                        }}
                        className={inputCls + ' font-mono text-xs'}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Direction — {gradAngle}°</label>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {[
                    { label: '↓', angle: 180 }, { label: '↗', angle: 45  },
                    { label: '→', angle: 90  }, { label: '↘', angle: 135 },
                    { label: '↙', angle: 225 }, { label: '←', angle: 270 },
                    { label: '↖', angle: 315 }, { label: '↑', angle: 0   },
                  ].map(({ label, angle }) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => {
                        setGradAngle(angle)
                        setFormData(p => ({ ...p, about_bg_color: `linear-gradient(${angle}deg, ${gradColor1}, ${gradColor2})` }))
                      }}
                      className={`w-9 h-9 rounded-lg text-base font-bold transition-all ${
                        gradAngle === angle ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="range" min="0" max="360" value={gradAngle}
                  onChange={e => {
                    const a = parseInt(e.target.value)
                    setGradAngle(a)
                    setFormData(p => ({ ...p, about_bg_color: `linear-gradient(${a}deg, ${gradColor1}, ${gradColor2})` }))
                  }}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>
          )}

          <div className="mt-5">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Preview</label>
            <div
              className="h-16 rounded-xl border border-gray-200 flex items-center justify-center transition-all"
              style={{ background: formData.about_bg_color }}
            >
              <span style={{ color: '#7a0000', opacity: 0.6, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                About Section Background
              </span>
            </div>
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
