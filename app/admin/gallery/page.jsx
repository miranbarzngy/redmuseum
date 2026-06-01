'use client'

import { useEffect, useState } from 'react'
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
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
  Frame,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Upload,
  Loader2,
  Globe,
  ImageIcon,
  CheckCircle2,
  X,
  Users,
  Zap,
  Award,
  Heart,
  Palette,
  ChevronDown,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import VisibilityToggle from '../components/VisibilityToggle'
import { logAudit } from '../../lib/auditLog'

const categories = [
  { id: 'visitor',    name: 'Visitor Touring',           Icon: Users  },
  { id: 'activity',  name: 'Activity',                   Icon: Zap    },
  { id: 'delegation',name: 'Official Delegation Visit',  Icon: Award  },
  { id: 'donation',  name: 'Donation',                   Icon: Heart  },
]

const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-400 bg-gray-50/50 transition-colors'

const langCols = [
  { suffix: '',    label: 'English', badge: 'bg-blue-100 text-blue-700',        dir: 'ltr', font: undefined },
  { suffix: '_ar', label: 'Arabic',  badge: 'bg-amber-100 text-amber-700',      dir: 'rtl', font: 'Cairo, Tahoma, sans-serif' },
]

function LangBadge({ label, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Globe size={11} />{label}
    </span>
  )
}

function SortableCard({ img, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: img.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' : 'static',
  }

  return (
    <div ref={setNodeRef} style={style} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative aspect-square">
        <img
          src={normalizePath(img.image_url)}
          alt={img.title || 'Gallery image'}
          className="w-full h-full object-cover"
          onError={e => { e.target.src = '/assets/images/bg-1.jpg' }}
        />
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 left-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        {/* Action overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(img)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-blue-700 text-xs font-semibold rounded-lg shadow hover:bg-blue-50 transition-colors"
          >
            <Pencil size={11} /> Edit
          </button>
          <button
            onClick={() => onDelete(img.id)}
            className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-red-600 text-xs font-semibold rounded-lg shadow hover:bg-red-50 transition-colors"
          >
            <Trash2 size={11} /> Del
          </button>
        </div>
      </div>
      <div className="px-3 py-2.5">
        <p className="font-medium text-sm text-gray-800 truncate">{img.title || 'Untitled'}</p>
      </div>
    </div>
  )
}

export default function GalleryManagement() {
  const [gallery, setGallery] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState('visitor')
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [formData, setFormData] = useState({ image_url: '', title: '', title_ar: '', description: '', description_ar: '' })

  // Appearance state
  const [bgColor,    setBgColor]    = useState('#0a0a0a')
  const [bgMode,     setBgMode]     = useState('solid')
  const [gradColor1, setGradColor1] = useState('#0a0a0a')
  const [gradColor2, setGradColor2] = useState('#1a1a2e')
  const [gradAngle,  setGradAngle]  = useState(135)
  const [savingBg,   setSavingBg]   = useState(false)
  const [savedBg,    setSavedBg]    = useState(false)
  const [settingsId, setSettingsId] = useState(1)
  const [appearanceOpen, setAppearanceOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { fetchGallery(); fetchAppearance() }, [])

  const fetchGallery = async () => {
    if (!supabase) { setLoading(false); return }
    try {
      const { data, error } = await supabase.from('gallery').select('*').order('display_order', { ascending: true })
      if (error) throw error
      setGallery(data || [])
    } catch (error) {
      console.error('Error fetching gallery:', error)
    } finally { setLoading(false) }
  }

  const fetchAppearance = async () => {
    try {
      const { data } = await supabase.from('settings').select('id, gallery_bg_color').single()
      if (data) {
        setSettingsId(data.id)
        const val = data.gallery_bg_color || '#0a0a0a'
        setBgColor(val)
        if (val.startsWith('linear-gradient')) {
          const m = val.match(/linear-gradient\((\d+)deg,\s*([^,]+),\s*([^)]+)\)/)
          if (m) { setBgMode('gradient'); setGradAngle(parseInt(m[1])); setGradColor1(m[2].trim()); setGradColor2(m[3].trim()) }
        }
      }
    } catch {}
  }

  const saveAppearance = async () => {
    setSavingBg(true)
    try {
      const { error } = await supabase.from('settings').upsert([{ id: settingsId, gallery_bg_color: bgColor, updated_at: new Date().toISOString() }], { onConflict: 'id' })
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

  const filteredImages = gallery.filter(img => img.category === selectedCategory)

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filteredImages.findIndex(img => img.id === active.id)
    const newIndex = filteredImages.findIndex(img => img.id === over.id)
    const reordered = arrayMove(filteredImages, oldIndex, newIndex)
    setGallery(prev => {
      const others = prev.filter(img => img.category !== selectedCategory)
      return [...others, ...reordered]
    })
    setSaving(true)
    try {
      const updates = reordered.map((img, i) => supabase.from('gallery').update({ display_order: i + 1 }).eq('id', img.id))
      const results = await Promise.all(updates)
      const failed = results.find(r => r.error)
      if (failed) throw failed.error
    } catch (error) {
      alert('Error saving order: ' + error.message)
      fetchGallery()
    } finally { setSaving(false) }
  }

  const deleteImage = async (id) => {
    if (!confirm('Are you sure you want to delete this image?')) return
    try {
      const img = gallery.find(g => g.id === id)
      const { error } = await supabase.from('gallery').delete().eq('id', id)
      if (error) throw error
      logAudit('delete', 'gallery', String(id), { title: img?.title, category: img?.category })
      setGallery(prev => prev.filter(img => img.id !== id))
    } catch (error) {
      alert('Error deleting image: ' + error.message)
    }
  }

  const handleFileUpload = async (file) => {
    if (!file) return null
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const filePath = `gallery/${selectedCategory}/${fileName}`
      const { error } = await supabase.storage.from('museum-images').upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('museum-images').getPublicUrl(filePath)
      return urlData.publicUrl
    } catch (error) {
      alert('Error uploading file: ' + error.message)
      return null
    } finally { setUploading(false) }
  }

  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const url = await handleFileUpload(file)
    if (url) setFormData(prev => ({ ...prev, image_url: url }))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.image_url) { alert('Please select or upload an image'); return }
    const data = {
      category: selectedCategory,
      image_url: formData.image_url,
      title: formData.title || null,
      title_ar: formData.title_ar || null,
      description: formData.description || null,
      description_ar: formData.description_ar || null,
      display_order: editingItem ? editingItem.display_order : filteredImages.length + 1,
      is_active: true,
    }
    try {
      if (editingItem) {
        const { error } = await supabase.from('gallery').update(data).eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('gallery').insert([data])
        if (error) throw error
      }
      logAudit(editingItem ? 'update' : 'create', 'gallery', editingItem ? String(editingItem.id) : null, { title: formData.title, category: selectedCategory })
      handleCancel()
      fetchGallery()
    } catch (error) {
      alert('Error saving: ' + error.message)
    }
  }

  const handleEdit = (item) => {
    setEditingItem(item)
    setIsAdding(true)
    setFormData({ image_url: item.image_url || '', title: item.title || '', title_ar: item.title_ar || '', description: item.description || '', description_ar: item.description_ar || '' })
  }

  const handleCancel = () => {
    setEditingItem(null)
    setIsAdding(false)
    setFormData({ image_url: '', title: '', title_ar: '', description: '', description_ar: '' })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-rose-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeCat = categories.find(c => c.id === selectedCategory)

  return (
    <div className="max-w-6xl pt-4 sm:pt-6">
      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-rose-700 to-rose-900 flex items-center justify-center shadow-lg shadow-rose-950/40 shrink-0">
            <Frame size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Gallery Management</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filteredImages.length} images in {activeCat?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {saving && (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin text-rose-500" /> Saving order…
            </span>
          )}
          <button
            onClick={() => { setIsAdding(true); setEditingItem(null); setFormData({ image_url: '', title: '', title_ar: '', description: '', description_ar: '' }) }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-br from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white rounded-xl shadow-lg shadow-rose-950/30 transition-all"
          >
            <Plus size={16} /> Add New Image
          </button>
        </div>
      </div>

      {/* Visibility toggle */}
      <div className="mb-5">
        <VisibilityToggle settingKey="show_gallery" label="Gallery Section" />
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
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
                  if (mode === 'solid') setBgColor('#0a0a0a')
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
                value={bgColor.startsWith('linear') ? '#0a0a0a' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={bgColor.startsWith('linear') ? '#0a0a0a' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                placeholder="#0a0a0a"
                className={inputCls + ' w-32 font-mono'}
              />
              <button
                type="button"
                onClick={() => setBgColor('#0a0a0a')}
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
                Gallery Section Background
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

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setSelectedCategory(cat.id); handleCancel() }}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-br from-rose-700 to-rose-900 text-white shadow-md shadow-rose-950/30'
                : 'bg-white border border-gray-200 text-gray-600 hover:border-rose-300 hover:text-rose-700'
            }`}
          >
            <cat.Icon size={14} />
            {cat.name}
          </button>
        ))}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-rose-700 to-rose-900 flex items-center justify-center shadow shadow-rose-950/40">
                {editingItem ? <Pencil size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
              </span>
              <h2 className="font-semibold text-gray-800">{editingItem ? 'Edit Image' : 'Add New Image'}</h2>
            </div>
            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Image upload */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Image</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={formData.image_url}
                  onChange={e => setFormData(prev => ({ ...prev, image_url: e.target.value }))}
                  placeholder="Enter image URL or upload a file"
                  className={inputCls}
                />
                <label className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer shrink-0 transition-all shadow-md ${
                  uploading
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed'
                    : 'bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-blue-900/30'
                }`}>
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload</>}
                  <input type="file" accept="image/*" onChange={handleFileSelect} className="hidden" disabled={uploading} />
                </label>
              </div>
              {formData.image_url ? (
                <img
                  src={normalizePath(formData.image_url)}
                  alt="Preview"
                  className="mt-3 h-28 w-auto rounded-xl border border-gray-200 object-cover shadow-sm"
                  onError={e => { e.target.style.display = 'none' }}
                />
              ) : (
                <div className="mt-3 flex items-center gap-2 h-16 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                  <ImageIcon size={16} /> No image selected
                </div>
              )}
            </div>

            {/* Title & Description — language columns */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-2">
                {langCols.map(l => <LangBadge key={l.suffix} label={l.label} cls={l.badge} />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-3">
                {langCols.map(l => (
                  <div key={l.suffix}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                    <input
                      type="text"
                      value={formData[`title${l.suffix}`]}
                      onChange={e => setFormData(prev => ({ ...prev, [`title${l.suffix}`]: e.target.value }))}
                      dir={l.dir}
                      style={l.font ? { fontFamily: l.font } : {}}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {langCols.map(l => (
                  <div key={l.suffix}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                    <textarea
                      value={formData[`description${l.suffix}`]}
                      onChange={e => setFormData(prev => ({ ...prev, [`description${l.suffix}`]: e.target.value }))}
                      rows={2}
                      dir={l.dir}
                      style={l.font ? { fontFamily: l.font } : {}}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-1">
              <button type="button" onClick={handleCancel} className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors">
                Cancel
              </button>
              <button
                type="submit"
                disabled={uploading}
                className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-rose-700 to-rose-900 hover:from-rose-800 hover:to-rose-950 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-rose-950/30 transition-all"
              >
                <CheckCircle2 size={15} />
                {editingItem ? 'Save Changes' : 'Add Image'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Images Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredImages.map(img => img.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredImages.map(img => (
              <SortableCard key={img.id} img={img} onEdit={handleEdit} onDelete={deleteImage} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredImages.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-rose-700 to-rose-900 flex items-center justify-center shadow-lg shadow-rose-950/40 mb-4">
            <Frame size={24} strokeWidth={1.6} className="text-white" />
          </span>
          <p className="text-sm font-medium text-gray-500">No images in this category</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add New Image" to get started</p>
        </div>
      )}
    </div>
  )
}
