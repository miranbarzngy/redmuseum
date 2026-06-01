'use client'

import { useState, useEffect } from 'react'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Image from 'next/image'
import {
  Crown,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Loader2,
  Globe,
  Lock,
  Unlock,
  Eye,
  EyeOff,
  CalendarDays,
  Timer,
  Phone,
  Link as LinkIcon,
  ImageIcon,
  CheckCircle2,
  X,
  AlertCircle,
  Palette,
  ChevronDown,
} from 'lucide-react'
import { getSupabaseClient } from '../../lib/supabase-client'
import VisibilityToggle from '../components/VisibilityToggle'
import { logAudit } from '../../lib/auditLog'

const EMPTY_SLIDE = {
  title_ku: '', title_en: '', title_ar: '',
  event_date: '',
  description_ku: '', description_en: '', description_ar: '',
  link: '', phone: '', phone2: '',
  countdown_to: '',
  is_locked: false,
  is_active: true,
  sort_order: 0,
  image_url: '',
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 bg-gray-50/50 transition-colors'

const langCols = [
  { field: 'ku', label: 'Kurdish', badge: 'bg-emerald-100 text-emerald-700', dir: 'rtl', font: 'UniSalar, Tahoma, sans-serif' },
  { field: 'en', label: 'English', badge: 'bg-blue-100 text-blue-700',       dir: 'ltr', font: undefined },
  { field: 'ar', label: 'Arabic',  badge: 'bg-amber-100 text-amber-700',     dir: 'rtl', font: 'Cairo, Tahoma, sans-serif' },
]

function LangBadge({ label, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Globe size={11} />{label}
    </span>
  )
}

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex items-center cursor-pointer">
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only peer" />
      <div className="w-10 h-5 bg-gray-200 rounded-full peer peer-checked:bg-amber-500 transition-colors" />
      <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5" />
    </label>
  )
}

function SortableRow({ slide, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: slide.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1, zIndex: isDragging ? 10 : 'auto', position: isDragging ? 'relative' : 'static' }

  return (
    <tr ref={setNodeRef} style={style} className="group hover:bg-amber-50/20 bg-white transition-colors">
      {/* Drag handle */}
      <td className="pl-3 pr-1 sm:pl-4 sm:pr-2 py-3 sm:py-4 w-8">
        <button {...attributes} {...listeners} className="p-1.5 rounded-lg text-gray-300 hover:text-gray-500 hover:bg-gray-100 transition-colors cursor-grab active:cursor-grabbing" title="Drag to reorder">
          <GripVertical size={16} />
        </button>
      </td>

      {/* Image */}
      <td className="px-2 sm:px-4 py-3 sm:py-4 w-12 sm:w-20">
        {slide.image_url ? (
          <Image src={slide.image_url} alt={slide.title_en || ''} width={44} height={44} className="w-10 h-10 sm:w-14 sm:h-14 rounded-lg sm:rounded-xl object-cover border border-gray-100 shadow-sm" unoptimized />
        ) : (
          <div className="w-10 h-10 sm:w-14 sm:h-14 bg-gray-100 rounded-lg sm:rounded-xl flex items-center justify-center">
            <ImageIcon size={16} className="text-gray-300" />
          </div>
        )}
      </td>

      {/* Title — on mobile shows date below */}
      <td className="px-2 sm:px-4 py-3 sm:py-4">
        <p className="font-semibold text-sm text-gray-800 leading-tight truncate" dir="rtl" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>{slide.title_ku || slide.title_en || '—'}</p>
        {slide.event_date && (
          <p className="md:hidden flex items-center gap-1 text-xs text-gray-400 mt-1">
            <CalendarDays size={10} className="shrink-0" />{slide.event_date}
          </p>
        )}
      </td>

      {/* Date — hidden on mobile */}
      <td className="hidden md:table-cell px-4 py-4 w-32">
        <span className="flex items-center gap-1.5 text-sm text-gray-600">
          <CalendarDays size={13} className="text-gray-400" />
          {slide.event_date || '—'}
        </span>
      </td>

      {/* Countdown — hidden on mobile */}
      <td className="hidden md:table-cell px-4 py-4 w-44">
        <span className="flex items-center gap-1.5 text-xs text-gray-500">
          <Timer size={12} className="text-gray-400" />
          {slide.countdown_to ? new Date(slide.countdown_to).toLocaleString() : '—'}
        </span>
      </td>

      {/* Lock — hidden on mobile */}
      <td className="hidden md:table-cell px-4 py-4 w-28">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${slide.is_locked ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
          {slide.is_locked ? <><Lock size={10} /> Locked</> : <><Unlock size={10} /> Free</>}
        </span>
      </td>

      {/* Status — hidden on mobile */}
      <td className="hidden md:table-cell px-4 py-4 w-24">
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${slide.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
          {slide.is_active ? <><Eye size={10} /> Active</> : <><EyeOff size={10} /> Inactive</>}
        </span>
      </td>

      {/* Actions */}
      <td className="pl-2 pr-4 sm:px-4 py-3 sm:py-4 w-auto">
        <div className="flex flex-col sm:flex-row items-end sm:items-center gap-1.5 sm:gap-2">
          {/* Status badge — mobile only */}
          <span className={`md:hidden inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${slide.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'}`}>
            {slide.is_active ? <><Eye size={10} /> Active</> : <><EyeOff size={10} /> Off</>}
          </span>
          <div className="flex items-center gap-1.5">
            <button onClick={() => onEdit(slide)} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <Pencil size={11} />
              <span className="hidden sm:inline">Edit</span>
            </button>
            <button onClick={() => onDelete(slide.id)} className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 text-xs font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors">
              <Trash2 size={11} />
              <span className="hidden sm:inline">Del</span>
            </button>
          </div>
        </div>
      </td>
    </tr>
  )
}

export default function ExclusiveAdmin() {
  const [masterActive, setMasterActive] = useState(false)
  const [masterEventId, setMasterEventId] = useState(null)
  const [slides, setSlides] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ text: '', type: '' })
  const [showModal, setShowModal] = useState(false)
  const [editingSlide, setEditingSlide] = useState(null)
  const [formData, setFormData] = useState(EMPTY_SLIDE)
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Appearance state
  const [bgColor,    setBgColor]    = useState('#000000')
  const [bgMode,     setBgMode]     = useState('solid')
  const [gradColor1, setGradColor1] = useState('#000000')
  const [gradColor2, setGradColor2] = useState('#1a0000')
  const [gradAngle,  setGradAngle]  = useState(135)
  const [savingBg,   setSavingBg]   = useState(false)
  const [savedBg,    setSavedBg]    = useState(false)
  const [settingsId, setSettingsId] = useState(1)
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetchAll()
    fetchAppearance()
    const supabase = getSupabaseClient()
    if (!supabase) return
    const channel = supabase
      .channel('admin-exclusive-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exclusive_slides' }, fetchAll)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'exclusive_events' }, fetchAll)
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchAppearance = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    try {
      const { data } = await supabase.from('settings').select('id, exclusive_bg_color').single()
      if (data) {
        setSettingsId(data.id)
        const val = data.exclusive_bg_color || '#000000'
        setBgColor(val)
        if (val.startsWith('linear-gradient')) {
          const m = val.match(/linear-gradient\((\d+)deg,\s*([^,]+),\s*([^)]+)\)/)
          if (m) { setBgMode('gradient'); setGradAngle(parseInt(m[1])); setGradColor1(m[2].trim()); setGradColor2(m[3].trim()) }
        }
      }
    } catch {}
  }

  const saveAppearance = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    setSavingBg(true)
    try {
      const { error } = await supabase.from('settings').upsert([{ id: settingsId, exclusive_bg_color: bgColor, updated_at: new Date().toISOString() }], { onConflict: 'id' })
      if (error) throw error
      setSavedBg(true)
      setTimeout(() => setSavedBg(false), 3000)
    } catch (err) {
      alert('Error saving appearance: ' + err.message)
    } finally { setSavingBg(false) }
  }

  const setGrad = (c1, c2, angle) => {
    setBgColor(`linear-gradient(${angle}deg, ${c1}, ${c2})`)
  }

  const fetchAll = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    try {
      const { data: eventData } = await supabase.from('exclusive_events').select('id, is_active').limit(1).maybeSingle()
      if (eventData) { setMasterActive(eventData.is_active); setMasterEventId(eventData.id) }
      else {
        const { data: newEvent } = await supabase.from('exclusive_events').insert([{ title_ku: 'تایبەت', title_en: 'Exclusive', title_ar: 'حصري', is_active: false }]).select('id, is_active').single()
        if (newEvent) { setMasterActive(newEvent.is_active); setMasterEventId(newEvent.id) }
      }
      const { data: slidesData, error } = await supabase.from('exclusive_slides').select('*').order('sort_order', { ascending: true })
      if (!error) setSlides(slidesData || [])
    } catch (err) { console.error('Error fetching exclusive data:', err.message || err) }
    finally { setLoading(false) }
  }

  const flash = (text, type = 'success') => { setMessage({ text, type }); setTimeout(() => setMessage({ text: '', type: '' }), 3000) }

  const handleToggleMaster = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    if (!masterEventId) { flash('Still loading — please try again', 'error'); fetchAll(); return }
    const newStatus = !masterActive
    setMasterActive(newStatus)
    const { error } = await supabase.from('exclusive_events').update({ is_active: newStatus }).eq('id', masterEventId)
    if (error) { setMasterActive(!newStatus); flash('Error updating master switch', 'error') }
    else flash(`Exclusive tab ${newStatus ? 'activated' : 'deactivated'}`)
  }

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = slides.findIndex(s => s.id === active.id)
    const newIndex = slides.findIndex(s => s.id === over.id)
    const reordered = arrayMove(slides, oldIndex, newIndex)
    setSlides(reordered)
    setSaving(true)
    const supabase = getSupabaseClient()
    try {
      for (let i = 0; i < reordered.length; i++) {
        const { error } = await supabase.from('exclusive_slides').update({ sort_order: i + 1 }).eq('id', reordered[i].id)
        if (error) throw error
      }
    } catch (err) { flash('Error saving order: ' + (err.message || 'unknown'), 'error'); fetchAll() }
    finally { setSaving(false) }
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
    } catch (err) { console.error('Upload error:', err.message || err); return null }
    finally { setUploading(false) }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const supabase = getSupabaseClient()
    if (!supabase) { flash('Client not available', 'error'); return }
    let imageUrl = formData.image_url
    if (imageFile) { imageUrl = await handleImageUpload(); if (!imageUrl) { flash('Image upload failed', 'error'); return } }
    const payload = { ...formData, image_url: imageUrl }
    if (payload.countdown_to) {
      // datetime-local value has no timezone — treat as local time and convert to UTC ISO for storage
      payload.countdown_to = new Date(payload.countdown_to).toISOString()
    } else {
      payload.countdown_to = null
    }
    if (!editingSlide) payload.sort_order = slides.length + 1
    delete payload.id
    try {
      if (editingSlide) { const { error } = await supabase.from('exclusive_slides').update(payload).eq('id', editingSlide.id); if (error) throw error }
      else { const { error } = await supabase.from('exclusive_slides').insert([payload]); if (error) throw error }
      logAudit(editingSlide ? 'update' : 'create', 'exclusive_slides', editingSlide ? String(editingSlide.id) : null, { title: formData.title_en || formData.title_ku })
      setShowModal(false); setEditingSlide(null); setFormData(EMPTY_SLIDE); setImageFile(null)
      flash(editingSlide ? 'Slide updated' : 'Slide created')
      fetchAll()
    } catch (err) { flash('Error saving slide: ' + (err.message || 'unknown error'), 'error') }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this slide?')) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    const { error } = await supabase.from('exclusive_slides').delete().eq('id', id)
    if (!error) {
      logAudit('delete', 'exclusive_slides', String(id), {})
      fetchAll()
    } else flash('Error deleting slide', 'error')
  }

  const openModal = (slide = null) => {
    setEditingSlide(slide)
    setFormData(slide ? {
      title_ku: slide.title_ku || '', title_en: slide.title_en || '', title_ar: slide.title_ar || '',
      event_date: slide.event_date || '',
      description_ku: slide.description_ku || '', description_en: slide.description_en || '', description_ar: slide.description_ar || '',
      link: slide.link || '', phone: slide.phone || '', phone2: slide.phone2 || '',
      countdown_to: slide.countdown_to ? (() => {
        const d = new Date(slide.countdown_to)
        const pad = n => String(n).padStart(2, '0')
        return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
      })() : '',
      is_locked: slide.is_locked || false, is_active: slide.is_active !== false,
      sort_order: slide.sort_order || 0, image_url: slide.image_url || '',
    } : EMPTY_SLIDE)
    setImageFile(null)
    setShowModal(true)
  }

  const set = (field, value) => setFormData(p => ({ ...p, [field]: value }))

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-amber-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-5 pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-950/40 shrink-0">
            <Crown size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Exclusive Events</h1>
            <p className="text-sm text-gray-400 mt-0.5 hidden sm:block">Landscape images (16:9) · Best size: 1920×1080px · Max 10 MB</p>
          </div>
          {saving && (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin text-amber-500" /> Saving order…
            </span>
          )}
        </div>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-br from-yellow-600 to-amber-700 hover:from-yellow-700 hover:to-amber-800 text-white rounded-xl shadow-lg shadow-amber-950/30 transition-all"
        >
          <Plus size={16} /> Add Slide
        </button>
      </div>

      <VisibilityToggle settingKey="show_exclusive" label="Exclusive Section" />

      {/* Appearance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden my-5">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 cursor-pointer select-none" onClick={() => setAppearanceOpen(o => !o)}>
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center shadow shadow-purple-950/40">
            <Palette size={15} strokeWidth={2} className="text-white" />
          </span>
          <h2 className="font-semibold text-gray-800">Appearance</h2>
          <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform duration-200 ${appearanceOpen ? 'rotate-180' : ''}`} />
        </div>
        {appearanceOpen && (
        <div className="p-6">

          {/* Mode toggle */}
          <div className="flex items-center gap-2 mb-5">
            {['solid', 'gradient'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setBgMode(mode)
                  if (mode === 'solid') setBgColor('#000000')
                  else setGrad(gradColor1, gradColor2, gradAngle)
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
                value={bgColor.startsWith('linear') ? '#000000' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={bgColor.startsWith('linear') ? '#000000' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                placeholder="#000000"
                className={inputCls + ' w-32 font-mono'}
              />
              <button
                type="button"
                onClick={() => setBgColor('#000000')}
                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Color 1 (Start)', val: gradColor1, isFirst: true },
                  { label: 'Color 2 (End)',   val: gradColor2, isFirst: false },
                ].map(({ label, val, isFirst }) => (
                  <div key={label}>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val}
                        onChange={e => {
                          const c1 = isFirst ? e.target.value : gradColor1
                          const c2 = isFirst ? gradColor2 : e.target.value
                          if (isFirst) setGradColor1(e.target.value); else setGradColor2(e.target.value)
                          setGrad(c1, c2, gradAngle)
                        }}
                        className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={e => {
                          const c1 = isFirst ? e.target.value : gradColor1
                          const c2 = isFirst ? gradColor2 : e.target.value
                          if (isFirst) setGradColor1(e.target.value); else setGradColor2(e.target.value)
                          setGrad(c1, c2, gradAngle)
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
                    { label: '↓', angle: 180 }, { label: '↗', angle: 45  }, { label: '→', angle: 90  }, { label: '↘', angle: 135 },
                    { label: '↙', angle: 225 }, { label: '←', angle: 270 }, { label: '↖', angle: 315 }, { label: '↑', angle: 0   },
                  ].map(({ label, angle }) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => { setGradAngle(angle); setGrad(gradColor1, gradColor2, angle) }}
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
                  onChange={e => { const a = parseInt(e.target.value); setGradAngle(a); setGrad(gradColor1, gradColor2, a) }}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mt-5">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Preview</label>
            <div
              className="h-16 rounded-xl border border-gray-200 flex items-center justify-center transition-all"
              style={{ background: bgColor }}
            >
              <span style={{ color: '#fff', opacity: 0.4, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Museum Activities Background
              </span>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 mt-5">
            {savedBg && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle2 size={15} /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={saveAppearance}
              disabled={savingBg}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-purple-600 to-purple-900 hover:from-purple-700 hover:to-purple-950 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-purple-950/30 transition-all"
            >
              {savingBg ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={15} /> Save Appearance</>}
            </button>
          </div>

        </div>
        )}
      </div>

      {/* Flash message */}
      {message.text && (
        <div className={`flex items-center gap-2 p-4 rounded-2xl text-sm font-medium border ${message.type === 'error' ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'}`}>
          {message.type === 'error' ? <AlertCircle size={15} /> : <CheckCircle2 size={15} />}
          {message.text}
        </div>
      )}

      {/* Table */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Crown size={15} className="text-amber-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Event Slides</h2>
            <span className="ml-auto bg-amber-100 text-amber-700 text-xs font-bold px-2 py-0.5 rounded-full">{slides.length}</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50/60">
                  <th className="pl-3 pr-1 sm:pl-4 sm:pr-2 py-3 w-8" />
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-12 sm:w-20">Image</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Title</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-32">Date</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-44">Countdown</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-28">Lock</th>
                  <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider w-24">Status</th>
                  <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <SortableContext items={slides.map(s => s.id)} strategy={verticalListSortingStrategy}>
                <tbody className="divide-y divide-gray-50">
                  {slides.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-16 text-center">
                        <span className="flex flex-col items-center gap-3 text-gray-400">
                          <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-700 flex items-center justify-center shadow">
                            <Crown size={20} strokeWidth={1.6} className="text-white" />
                          </span>
                          <span className="text-sm font-medium text-gray-500">No slides yet</span>
                          <span className="text-xs">Click "Add Slide" to get started</span>
                        </span>
                      </td>
                    </tr>
                  )}
                  {slides.map(slide => (
                    <SortableRow key={slide.id} slide={slide} onEdit={openModal} onDelete={handleDelete} />
                  ))}
                </tbody>
              </SortableContext>
            </table>
          </div>
        </div>
      </DndContext>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-start justify-center z-50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden">
            {/* Modal header */}
            <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
              <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-600 to-amber-700 flex items-center justify-center shadow">
                {editingSlide ? <Pencil size={15} className="text-white" /> : <Plus size={15} className="text-white" />}
              </span>
              <h2 className="font-bold text-gray-900">{editingSlide ? 'Edit Slide' : 'Add New Slide'}</h2>
              <button onClick={() => setShowModal(false)} className="ml-auto p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              {/* Image */}
              <div>
                <label className="block text-xs font-medium text-gray-500 mb-2">
                  Image <span className="text-gray-400 font-normal">— Recommended: A4 landscape (297 × 210 mm)</span>
                </label>
                <input
                  type="file" accept="image/*"
                  onChange={e => setImageFile(e.target.files[0])}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50/50 focus:outline-none focus:ring-2 focus:ring-amber-500/40 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-amber-100 file:text-amber-700 hover:file:bg-amber-200 cursor-pointer"
                />
                {formData.image_url && (
                  <Image src={formData.image_url} alt="Current" width={80} height={80} className="mt-3 rounded-xl object-cover border border-gray-100 shadow-sm" unoptimized />
                )}
              </div>

              {/* Titles */}
              <div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-2">
                  {langCols.map(l => <LangBadge key={l.field} label={l.label} cls={l.badge} />)}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                  {langCols.map(l => (
                    <div key={l.field}>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                      <input value={formData[`title_${l.field}`]} onChange={e => set(`title_${l.field}`, e.target.value)} dir={l.dir} style={l.font ? { fontFamily: l.font } : {}} className={inputCls} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {langCols.map(l => (
                    <div key={l.field}>
                      <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                      <textarea value={formData[`description_${l.field}`]} onChange={e => set(`description_${l.field}`, e.target.value)} rows={3} dir={l.dir} style={l.font ? { fontFamily: l.font } : {}} className={inputCls} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Date & Countdown */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><CalendarDays size={11} className="text-gray-400" /> Event Date</label>
                  <input type="date" value={formData.event_date} onChange={e => set('event_date', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><Timer size={11} className="text-gray-400" /> Countdown To</label>
                  <input type="datetime-local" value={formData.countdown_to} onChange={e => set('countdown_to', e.target.value)} className={inputCls} />
                </div>
              </div>

              {/* Phone & Link */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><Phone size={11} className="text-gray-400" /> Phone</label>
                  <input type="text" value={formData.phone} onChange={e => set('phone', e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><Phone size={11} className="text-gray-400" /> Phone 2</label>
                  <input type="text" value={formData.phone2} onChange={e => set('phone2', e.target.value)} className={inputCls} />
                </div>
              </div>
              <div>
                <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 mb-1.5"><LinkIcon size={11} className="text-gray-400" /> Link (optional)</label>
                <input type="url" value={formData.link} placeholder="https://" onChange={e => set('link', e.target.value)} className={inputCls} />
              </div>

              {/* Toggles */}
              <div className="flex gap-6 py-2">
                <label className="flex items-center gap-3 cursor-pointer">
                  <Toggle checked={formData.is_locked} onChange={e => set('is_locked', e.target.checked)} />
                  <div>
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-1"><Lock size={12} /> Lock slide</p>
                    <p className="text-xs text-gray-400">Disable auto-advance</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 cursor-pointer">
                  <Toggle checked={formData.is_active} onChange={e => set('is_active', e.target.checked)} />
                  <div>
                    <p className="text-sm font-medium text-gray-800 flex items-center gap-1"><Eye size={12} /> Active</p>
                    <p className="text-xs text-gray-400">Show on website</p>
                  </div>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={uploading} className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold bg-gradient-to-br from-yellow-600 to-amber-700 hover:from-yellow-700 hover:to-amber-800 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-amber-950/30 transition-all">
                  {uploading ? <><Loader2 size={15} className="animate-spin" /> Uploading…</> : <><CheckCircle2 size={15} /> {editingSlide ? 'Update Slide' : 'Create Slide'}</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
