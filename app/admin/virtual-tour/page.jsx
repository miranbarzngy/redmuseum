'use client'

import { useState, useEffect } from 'react'
import {
  Compass, Plus, Pencil, Trash2, GripVertical, Loader2,
  Globe, Upload, ImageIcon, CheckCircle2, X, Link as LinkIcon,
} from 'lucide-react'
import {
  DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors,
} from '@dnd-kit/core'
import {
  SortableContext, sortableKeyboardCoordinates, useSortable,
  verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { supabase } from '../../lib/supabase-client'
import { compressImage } from '../../lib/compressImage'
import VisibilityToggle from '../components/VisibilityToggle'
import { logAudit } from '../../lib/auditLog'

const EMPTY = {
  title_ku: '', title_en: '', title_ar: '',
  description_ku: '', description_en: '', description_ar: '',
  image_url: '', embed_url: '', is_active: true, display_order: 0,
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-400 bg-gray-50/50 transition-colors'

const langCols = [
  { field: 'ku', label: 'Kurdish', badge: 'bg-emerald-100 text-emerald-700', dir: 'rtl', font: 'UniSalar, Tahoma, sans-serif' },
  { field: 'en', label: 'English', badge: 'bg-blue-100 text-blue-700',       dir: 'ltr', font: undefined },
  { field: 'ar', label: 'Arabic',  badge: 'bg-amber-100 text-amber-700',     dir: 'rtl', font: 'ArabicFont, Tahoma, sans-serif' },
]

function LangBadge({ label, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Globe size={11} />{label}
    </span>
  )
}

function SortableRow({ item, onEdit, onDelete, onToggle }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.5 : 1 }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-center gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-3 hover:shadow-md transition-shadow"
    >
      <button {...attributes} {...listeners} className="text-gray-300 hover:text-gray-500 cursor-grab active:cursor-grabbing shrink-0">
        <GripVertical size={18} />
      </button>

      {item.image_url ? (
        <img src={item.image_url} alt="" className="w-14 h-10 object-cover rounded-lg border border-gray-100 shrink-0" onError={e => { e.target.style.display = 'none' }} />
      ) : (
        <div className="w-14 h-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
          <ImageIcon size={16} className="text-gray-300" />
        </div>
      )}

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm text-gray-800 truncate" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
          {item.title_ku || item.title_en || 'Untitled'}
        </p>
        {item.title_en && item.title_ku && (
          <p className="text-xs text-gray-400 truncate">{item.title_en}</p>
        )}
      </div>

      {item.embed_url && (
        <span className="flex items-center gap-1 text-xs text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded-full font-medium shrink-0">
          <LinkIcon size={10} /> Embed
        </span>
      )}

      <button
        onClick={() => onToggle(item)}
        className={`text-xs px-2.5 py-1 rounded-full font-semibold border transition-colors shrink-0 ${
          item.is_active ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-50 text-gray-400 border-gray-200'
        }`}
      >
        {item.is_active ? 'Active' : 'Hidden'}
      </button>

      <div className="flex gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button onClick={() => onEdit(item)} className="p-2 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
          <Pencil size={14} />
        </button>
        <button onClick={() => onDelete(item.id)} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

export default function VirtualTourAdmin() {
  const [items, setItems]         = useState([])
  const [loading, setLoading]     = useState(true)
  const [saving, setSaving]       = useState(false)
  const [uploading, setUploading] = useState(false)
  const [isAdding, setIsAdding]   = useState(false)
  const [editing, setEditing]     = useState(null)
  const [form, setForm]           = useState(EMPTY)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  useEffect(() => { fetchItems() }, [])

  const fetchItems = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('virtual_tour_items')
        .select('*')
        .order('display_order', { ascending: true })
      if (error) throw error
      setItems(data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const handleDragEnd = async ({ active, over }) => {
    if (!over || active.id === over.id) return
    const oldIdx = items.findIndex(i => i.id === active.id)
    const newIdx = items.findIndex(i => i.id === over.id)
    const reordered = arrayMove(items, oldIdx, newIdx)
    setItems(reordered)
    setSaving(true)
    try {
      await Promise.all(reordered.map((item, idx) =>
        supabase.from('virtual_tour_items').update({ display_order: idx + 1 }).eq('id', item.id)
      ))
    } catch (e) { alert('Error saving order: ' + e.message); fetchItems() }
    finally { setSaving(false) }
  }

  const handleUpload = async (file) => {
    if (!file) return null
    setUploading(true)
    try {
      const compressed = await compressImage(file)
      const ext = compressed.name.split('.').pop()
      const path = `virtual-tour/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
      const { error } = await supabase.storage.from('museum-images').upload(path, compressed, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data } = supabase.storage.from('museum-images').getPublicUrl(path)
      return data.publicUrl
    } catch (e) { alert('Upload error: ' + e.message); return null }
    finally { setUploading(false) }
  }

  const handleSave = async (e) => {
    e.preventDefault()
    const data = {
      title_ku: form.title_ku || null, title_en: form.title_en || null, title_ar: form.title_ar || null,
      description_ku: form.description_ku || null, description_en: form.description_en || null, description_ar: form.description_ar || null,
      image_url: form.image_url || null, embed_url: form.embed_url || null,
      is_active: form.is_active,
      display_order: editing ? editing.display_order : items.length + 1,
    }
    try {
      if (editing) {
        const { error } = await supabase.from('virtual_tour_items').update(data).eq('id', editing.id)
        if (error) throw error
        logAudit('update', 'virtual_tour_items', String(editing.id), { title: data.title_en || data.title_ku })
      } else {
        const { error } = await supabase.from('virtual_tour_items').insert([data])
        if (error) throw error
        logAudit('create', 'virtual_tour_items', null, { title: data.title_en || data.title_ku })
      }
      handleCancel(); fetchItems()
    } catch (e) { alert('Error saving: ' + e.message) }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this virtual tour stop?')) return
    try {
      const { error } = await supabase.from('virtual_tour_items').delete().eq('id', id)
      if (error) throw error
      logAudit('delete', 'virtual_tour_items', String(id), {})
      setItems(prev => prev.filter(i => i.id !== id))
    } catch (e) { alert('Error deleting: ' + e.message) }
  }

  const handleToggle = async (item) => {
    try {
      const { error } = await supabase.from('virtual_tour_items').update({ is_active: !item.is_active }).eq('id', item.id)
      if (error) throw error
      setItems(prev => prev.map(i => i.id === item.id ? { ...i, is_active: !i.is_active } : i))
    } catch (e) { alert('Error: ' + e.message) }
  }

  const handleEdit = (item) => {
    setEditing(item)
    setForm({
      title_ku: item.title_ku || '', title_en: item.title_en || '', title_ar: item.title_ar || '',
      description_ku: item.description_ku || '', description_en: item.description_en || '', description_ar: item.description_ar || '',
      image_url: item.image_url || '', embed_url: item.embed_url || '', is_active: item.is_active !== false,
    })
    setIsAdding(true)
  }

  const handleCancel = () => { setEditing(null); setIsAdding(false); setForm(EMPTY) }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-cyan-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-4xl pt-4 sm:pt-6">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-900 flex items-center justify-center shadow-lg shadow-cyan-950/40 shrink-0">
            <Compass size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Virtual Tour</h1>
            <p className="text-sm text-gray-400 mt-0.5">{items.length} stops</p>
          </div>
          {saving && (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin" /> Saving…
            </span>
          )}
        </div>
        <button
          onClick={() => { setIsAdding(true); setEditing(null); setForm(EMPTY) }}
          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-br from-cyan-600 to-cyan-900 hover:from-cyan-700 hover:to-cyan-950 text-white rounded-xl shadow-lg shadow-cyan-950/30 transition-all"
        >
          <Plus size={15} /> Add Stop
        </button>
      </div>

      {/* Visibility toggle */}
      <div className="mb-5">
        <VisibilityToggle settingKey="show_virtual_tour" label="Virtual Tour Section" />
      </div>

      {/* Add / Edit form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-600 to-cyan-900 flex items-center justify-center shadow shadow-cyan-950/40">
                {editing ? <Pencil size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
              </span>
              <h2 className="font-semibold text-gray-800">{editing ? 'Edit Tour Stop' : 'Add Tour Stop'}</h2>
            </div>
            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">

            {/* Titles */}
            <div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-2">
                {langCols.map(l => <LangBadge key={l.field} label={l.label} cls={l.badge} />)}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-3">
                {langCols.map(l => (
                  <div key={l.field}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                    <input
                      type="text" value={form[`title_${l.field}`]}
                      onChange={e => setForm(p => ({ ...p, [`title_${l.field}`]: e.target.value }))}
                      dir={l.dir} style={l.font ? { fontFamily: l.font } : {}}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>

              {/* Descriptions */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {langCols.map(l => (
                  <div key={l.field}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                    <textarea
                      rows={3} value={form[`description_${l.field}`]}
                      onChange={e => setForm(p => ({ ...p, [`description_${l.field}`]: e.target.value }))}
                      dir={l.dir} style={l.font ? { fontFamily: l.font } : {}}
                      className={inputCls}
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Cover Image</label>
              <div className="flex gap-2">
                <input
                  type="text" value={form.image_url} placeholder="Image URL or upload"
                  onChange={e => setForm(p => ({ ...p, image_url: e.target.value }))}
                  className={inputCls}
                />
                <label className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer shrink-0 shadow-md transition-all ${uploading ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-blue-900/30'}`}>
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload</>}
                  <input type="file" accept="image/*" className="hidden" disabled={uploading}
                    onChange={async e => { const url = await handleUpload(e.target.files?.[0]); if (url) setForm(p => ({ ...p, image_url: url })) }}
                  />
                </label>
              </div>
              {form.image_url && (
                <img src={form.image_url} alt="" className="mt-3 h-24 w-auto rounded-xl border border-gray-200 object-cover shadow-sm" onError={e => { e.target.style.display = 'none' }} />
              )}
            </div>

            {/* Embed URL */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">
                360° / Embed URL <span className="text-gray-400 font-normal">(optional — iframe src for Matterport, Google Street View, etc.)</span>
              </label>
              <div className="relative">
                <LinkIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                  type="url" value={form.embed_url} placeholder="https://..."
                  onChange={e => setForm(p => ({ ...p, embed_url: e.target.value }))}
                  className={inputCls + ' pl-9'}
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between gap-3 pt-1">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, is_active: !p.is_active }))}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                  form.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${form.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {form.is_active ? 'Active — visible on site' : 'Hidden — not on site'}
              </button>
              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-cyan-600 to-cyan-900 hover:from-cyan-700 hover:to-cyan-950 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-cyan-950/30 transition-all">
                  <CheckCircle2 size={15} />
                  {editing ? 'Save Changes' : 'Add Stop'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* List */}
      {items.length > 0 ? (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <SortableContext items={items.map(i => i.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map(item => (
                <SortableRow key={item.id} item={item} onEdit={handleEdit} onDelete={handleDelete} onToggle={handleToggle} />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      ) : (
        !isAdding && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-600 to-cyan-900 flex items-center justify-center shadow-lg shadow-cyan-950/40 mb-4">
              <Compass size={24} strokeWidth={1.6} className="text-white" />
            </span>
            <p className="text-sm font-medium text-gray-500">No virtual tour stops yet</p>
            <p className="text-xs text-gray-400 mt-1">Click "Add Stop" to get started</p>
          </div>
        )
      )}
    </div>
  )
}
