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
import Link from 'next/link'
import {
  ScrollText,
  Tags,
  Plus,
  Pencil,
  Trash2,
  GripVertical,
  Upload,
  Loader2,
  Globe,
  ImageIcon,
  FileText,
  Mail,
  Camera,
  CheckCircle2,
  X,
  FileArchive,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import VisibilityToggle from '../components/VisibilityToggle'
import QRCode from 'qrcode'

const defaultCategories = [
  { id: 'documents', name_en: 'Documents', name_ku: 'بەڵگەنامەکان', Icon: FileText },
  { id: 'letters',   name_en: 'Letters',   name_ku: 'نامەکان',      Icon: Mail   },
  { id: 'photos',    name_en: 'Photos',    name_ku: 'وێنە کۆنەکان', Icon: Camera },
]

const categoryIcons = { documents: FileText, letters: Mail, photos: Camera }

const normalizePath = (path) => {
  if (!path) return null
  if (path.startsWith('http://') || path.startsWith('https://')) return path
  if (path.startsWith('/')) return path
  return `/${path}`
}

const categoryStringToSlug = { Documents: 'documents', Letters: 'letters', Photos: 'photos' }

const downloadQR = async (item) => {
  const url = `${window.location.origin}/kurdish/archive/${item.id}`
  const label = item.title_ku || item.title_en || 'Archive Item'

  // Load UniSalar font for Kurdish text
  let uniSalarLoaded = false
  try {
    const fontFace = new FontFace('UniSalar', 'url(/fonts/UniSalar.otf)')
    await fontFace.load()
    document.fonts.add(fontFace)
    uniSalarLoaded = true
  } catch {}

  const kuFont = uniSalarLoaded ? 'UniSalar, Tahoma, sans-serif' : 'Tahoma, sans-serif'

  // --- sizes ---
  const W = 480, PAD = 28, QR_SIZE = W - PAD * 2
  const HEADER_H = 64, FOOTER_H = 90
  const H = HEADER_H + QR_SIZE + FOOTER_H

  const canvas = document.createElement('canvas')
  canvas.width = W; canvas.height = H
  const ctx = canvas.getContext('2d')

  // White background
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, W, H)

  // Museum red header bar
  ctx.fillStyle = '#7a0000'
  ctx.fillRect(0, 0, W, HEADER_H)

  // Gold accent line under header
  ctx.fillStyle = '#c8a96e'
  ctx.fillRect(0, HEADER_H, W, 2)

  // Header title in Kurdish (UniSalar)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold 18px ${kuFont}`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.direction = 'rtl'
  const maxLen = 36
  const displayLabel = label.length > maxLen ? label.slice(0, maxLen) + '…' : label
  ctx.fillText(displayLabel, W / 2, HEADER_H / 2)
  ctx.direction = 'ltr'

  // QR code
  const qrCanvas = document.createElement('canvas')
  await QRCode.toCanvas(qrCanvas, url, {
    width: QR_SIZE, margin: 1,
    color: { dark: '#1a0a0a', light: '#ffffff' },
    errorCorrectionLevel: 'H',
  })
  ctx.drawImage(qrCanvas, PAD, HEADER_H + 2)

  // Footer background
  ctx.fillStyle = '#fafafa'
  ctx.fillRect(0, HEADER_H + 2 + QR_SIZE, W, FOOTER_H)

  // Gold top line on footer
  ctx.fillStyle = 'rgba(200,169,110,0.6)'
  ctx.fillRect(0, HEADER_H + 2 + QR_SIZE, W, 1.5)

  const footerY = HEADER_H + 2 + QR_SIZE + FOOTER_H / 2 + 2

  // "سکان بکە" in UniSalar
  ctx.fillStyle = '#000000'
  ctx.font = `bold 26px ${kuFont}`
  ctx.textAlign = 'center'
  ctx.direction = 'rtl'
  ctx.textBaseline = 'middle'
  ctx.fillText('سکان بکە', W / 2, footerY)
  ctx.direction = 'ltr'

  // Bottom gold accent bar
  ctx.fillStyle = '#c8a96e'
  ctx.fillRect(0, H - 5, W, 5)

  // Trigger download
  const link = document.createElement('a')
  link.download = `qr-archive-${item.id}.png`
  link.href = canvas.toDataURL('image/png')
  link.click()
}

const inputCls = 'w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/40 focus:border-amber-400 bg-gray-50/50 transition-colors'

const langCols = [
  { suffix: '_en', label: 'English', badge: 'bg-blue-100 text-blue-700',        dir: 'ltr', font: undefined },
  { suffix: '_ku', label: 'Kurdish', badge: 'bg-emerald-100 text-emerald-700',   dir: 'rtl', font: 'UniSalar, Tahoma, sans-serif' },
  { suffix: '_ar', label: 'Arabic',  badge: 'bg-amber-100 text-amber-700',       dir: 'rtl', font: 'Cairo, Tahoma, sans-serif' },
]

function LangBadge({ label, cls }) {
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold ${cls}`}>
      <Globe size={11} />{label}
    </span>
  )
}

function SortableCard({ item, categoryName, onEdit, onDelete, onDownloadQR, onToggleActive }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: item.id })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 50 : 'auto',
    position: isDragging ? 'relative' : 'static',
  }

  return (
    <div ref={setNodeRef} style={style} className="group bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative h-48 bg-stone-50 flex items-center justify-center">
        <img
          src={normalizePath(item.image_url)}
          alt={item.title_en || item.title_ku || 'Archive item'}
          className="w-full h-full object-contain p-2"
          onError={e => { e.target.src = '/assets/images/bg-1.jpg' }}
        />
        {/* Category badge */}
        <span className="absolute top-2 left-2 flex items-center gap-1 bg-stone-700/80 backdrop-blur-sm text-white text-xs px-2 py-1 rounded-lg font-medium">
          <ScrollText size={10} />{categoryName}
        </span>
        {/* Drag handle */}
        <button
          {...attributes}
          {...listeners}
          className="absolute top-2 right-2 bg-black/50 hover:bg-black/70 text-white p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing"
          title="Drag to reorder"
        >
          <GripVertical size={14} />
        </button>
        {/* Action overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute bottom-2 right-2 flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onDownloadQR(item)} className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-violet-700 text-xs font-semibold rounded-lg shadow hover:bg-violet-50 transition-colors" title="Download QR Code">
            <i className="ri-qr-code-line text-xs" /> QR
          </button>
          <button onClick={() => onEdit(item)} className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-blue-700 text-xs font-semibold rounded-lg shadow hover:bg-blue-50 transition-colors">
            <Pencil size={11} /> Edit
          </button>
          <button onClick={() => onDelete(item.id)} className="flex items-center gap-1 px-2.5 py-1.5 bg-white text-red-600 text-xs font-semibold rounded-lg shadow hover:bg-red-50 transition-colors">
            <Trash2 size={11} /> Del
          </button>
        </div>
      </div>
      <div className="px-3 py-2.5 flex items-center justify-between gap-2">
        <p className="font-medium text-sm text-gray-800 truncate">{item.title_ku || item.title_en || 'Untitled'}</p>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.file_url && (
            <span className="flex items-center gap-1 text-xs text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full font-medium">
              <FileText size={10} /> PDF
            </span>
          )}
          <button
            onClick={() => onToggleActive(item)}
            className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border transition-colors ${
              item.is_active
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                : 'bg-gray-50 text-gray-400 border-gray-200 hover:bg-gray-100'
            }`}
          >
            {item.is_active ? 'Active' : 'Hidden'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function ArchiveManagement() {
  const [categories, setCategories] = useState([])
  const [archive, setArchive] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [editingItem, setEditingItem] = useState(null)
  const [isAdding, setIsAdding] = useState(false)
  const [uploading, setUploading] = useState(false)

  const emptyForm = { title_en: '', title_ku: '', title_ar: '', description_en: '', description_ku: '', description_ar: '', category_id: '', image_url: '', file_url: '', is_active: true }
  const [formData, setFormData] = useState(emptyForm)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => { fetchCategories() }, [])

  const fetchCategories = async () => {
    if (!supabase) { setCategories(defaultCategories); return }
    try {
      const { data, error } = await supabase.from('archive_categories').select('*').order('display_order', { ascending: true })
      if (error) throw error
      if (data && data.length > 0) { setCategories(data); setSelectedCategory(data[0].id) }
      else { setCategories(defaultCategories) }
    } catch { setCategories(defaultCategories) }
  }

  useEffect(() => { if (selectedCategory) fetchArchive() }, [selectedCategory])

  const fetchArchive = async () => {
    if (!supabase) { setLoading(false); return }
    try {
      const { data, error } = await supabase.from('digital_archive').select('*').order('display_order', { ascending: true })
      if (error) throw error
      setArchive(data || [])
    } catch (error) { console.error('Error fetching archive:', error) }
    finally { setLoading(false) }
  }

  const getCategoryById = id => categories.find(c => c.id === id) || null

  const getCategoryName = item => {
    if (item.category_id) { const cat = getCategoryById(item.category_id); if (cat) return cat.name_en }
    if (item.category) { const cat = categories.find(c => c.slug === item.category.toLowerCase()); if (cat) return cat.name_en; return item.category }
    return 'Unknown'
  }

  const filteredItems = archive.filter(item => {
    if (!selectedCategory) return true
    if (item.category_id === selectedCategory) return true
    const cat = getCategoryById(selectedCategory)
    if (cat && item.category && (item.category.toLowerCase() === cat.slug || item.category.toLowerCase() === cat.id)) return true
    return false
  })

  const handleDragEnd = async (event) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    const oldIndex = filteredItems.findIndex(i => i.id === active.id)
    const newIndex = filteredItems.findIndex(i => i.id === over.id)
    const reordered = arrayMove(filteredItems, oldIndex, newIndex)
    setArchive(prev => { const others = prev.filter(i => !reordered.find(r => r.id === i.id)); return [...others, ...reordered] })
    setSaving(true)
    try {
      const updates = reordered.map((item, i) => supabase.from('digital_archive').update({ display_order: i + 1 }).eq('id', item.id))
      const results = await Promise.all(updates)
      const failed = results.find(r => r.error)
      if (failed) throw failed.error
    } catch (error) { alert('Error saving order: ' + error.message); fetchArchive() }
    finally { setSaving(false) }
  }

  const deleteItem = async (id) => {
    if (!confirm('Are you sure you want to delete this item?')) return
    try {
      const { error } = await supabase.from('digital_archive').delete().eq('id', id)
      if (error) throw error
      setArchive(prev => prev.filter(i => i.id !== id))
    } catch (error) { alert('Error deleting item: ' + error.message) }
  }

  const handleFileUpload = async (file, type = 'image') => {
    if (!file) return null
    setUploading(true)
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`
      const folder = type === 'image' ? 'archive-images' : 'archive-files'
      const filePath = `${folder}/${fileName}`
      const { error } = await supabase.storage.from('museum-images').upload(filePath, file, { cacheControl: '3600', upsert: false })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('museum-images').getPublicUrl(filePath)
      return urlData.publicUrl
    } catch (error) { alert('Error uploading file: ' + error.message); return null }
    finally { setUploading(false) }
  }

  const handleInputChange = e => { const { name, value } = e.target; setFormData(prev => ({ ...prev, [name]: value })) }
  const handleImageSelect = async e => { const file = e.target.files?.[0]; if (!file) return; const url = await handleFileUpload(file, 'image'); if (url) setFormData(prev => ({ ...prev, image_url: url })) }
  const handleFileSelect  = async e => { const file = e.target.files?.[0]; if (!file) return; const url = await handleFileUpload(file, 'file');  if (url) setFormData(prev => ({ ...prev, file_url: url })) }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!formData.image_url) { alert('Please select or upload an image'); return }
    if (!formData.category_id) { alert('Please select a category'); return }
    const selectedCat = categories.find(c => c.id === formData.category_id)
    const currentCount = archive.filter(i => i.category_id === formData.category_id).length
    const data = {
      title_en: formData.title_en || null, title_ku: formData.title_ku || null, title_ar: formData.title_ar || null,
      description_en: formData.description_en || null, description_ku: formData.description_ku || null, description_ar: formData.description_ar || null,
      category_id: formData.category_id, category: selectedCat?.slug || '',
      image_url: formData.image_url, file_url: formData.file_url || null,
      display_order: editingItem ? editingItem.display_order : currentCount + 1, is_active: formData.is_active,
    }
    try {
      if (editingItem) { const { error } = await supabase.from('digital_archive').update(data).eq('id', editingItem.id); if (error) throw error }
      else { const { error } = await supabase.from('digital_archive').insert([data]); if (error) throw error }
      handleCancel(); fetchArchive()
    } catch (error) { alert('Error saving: ' + error.message) }
  }

  const toggleActive = async (item) => {
    try {
      const { error } = await supabase.from('digital_archive').update({ is_active: !item.is_active }).eq('id', item.id)
      if (error) throw error
      setArchive(prev => prev.map(a => a.id === item.id ? { ...a, is_active: !item.is_active } : a))
    } catch (e) { alert('Failed to update: ' + e.message) }
  }

  const handleEdit = (item) => {
    setEditingItem(item); setIsAdding(true)
    let categoryId = item.category_id
    if (!categoryId && item.category) {
      const slug = categoryStringToSlug[item.category] || item.category.toLowerCase()
      const cat = categories.find(c => c.slug === slug || c.id === slug)
      if (cat) categoryId = cat.id
    }
    setFormData({ title_en: item.title_en || '', title_ku: item.title_ku || '', title_ar: item.title_ar || '', description_en: item.description_en || '', description_ku: item.description_ku || '', description_ar: item.description_ar || '', category_id: categoryId || '', image_url: item.image_url || '', file_url: item.file_url || '', is_active: item.is_active !== false })
  }

  const handleCancel = () => { setEditingItem(null); setIsAdding(false); setFormData(emptyForm) }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-stone-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  const activeCat = categories.find(c => c.id === selectedCategory)
  const CatIcon = categoryIcons[activeCat?.id] || categoryIcons[activeCat?.slug] || ScrollText

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center shadow-lg shadow-stone-950/40">
            <ScrollText size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Digital Archive</h1>
            <p className="text-sm text-gray-400 mt-0.5">{filteredItems.length} items in {activeCat?.name_en || 'archive'}</p>
          </div>
          {saving && (
            <span className="flex items-center gap-2 text-sm text-gray-400">
              <Loader2 size={14} className="animate-spin text-stone-500" /> Saving order…
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/admin/archive/categories"
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium bg-white border border-gray-200 text-gray-700 hover:border-violet-400 hover:text-violet-700 rounded-xl transition-all"
          >
            <Tags size={15} /> Manage Categories
          </Link>
          <button
            onClick={() => { setIsAdding(true); setEditingItem(null); setFormData({ ...emptyForm, category_id: selectedCategory }) }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold bg-gradient-to-br from-stone-600 to-stone-800 hover:from-stone-700 hover:to-stone-900 text-white rounded-xl shadow-lg shadow-stone-950/30 transition-all"
          >
            <Plus size={16} /> Add New Item
          </button>
        </div>
      </div>

      {/* Visibility toggle */}
      <div className="mb-5">
        <VisibilityToggle settingKey="show_archive" label="Archive Section" />
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6">
        {categories.map(cat => {
          const Icon = categoryIcons[cat.id] || categoryIcons[cat.slug] || ScrollText
          return (
            <button
              key={cat.id}
              onClick={() => { setSelectedCategory(cat.id); handleCancel(); setFormData({ ...emptyForm, category_id: cat.id }) }}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-gradient-to-br from-stone-600 to-stone-800 text-white shadow-md shadow-stone-950/30'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-stone-400 hover:text-stone-700'
              }`}
            >
              <Icon size={14} />
              {cat.name_en} / {cat.name_ku}
            </button>
          )
        })}
      </div>

      {/* Add / Edit Form */}
      {isAdding && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden mb-6">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center shadow shadow-stone-950/40">
                {editingItem ? <Pencil size={14} className="text-white" /> : <Plus size={14} className="text-white" />}
              </span>
              <h2 className="font-semibold text-gray-800">{editingItem ? 'Edit Archive Item' : 'Add New Archive Item'}</h2>
            </div>
            <button onClick={handleCancel} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
              <X size={16} />
            </button>
          </div>

          <form onSubmit={handleSave} className="p-6 space-y-5">
            {/* Category select */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Category</label>
              <select name="category_id" value={formData.category_id} onChange={handleInputChange} className={inputCls} required>
                <option value="">Select a category</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.name_en} / {cat.name_ku}</option>
                ))}
              </select>
            </div>

            {/* Title — language columns */}
            <div>
              <div className="grid grid-cols-3 gap-4 mb-2">
                {langCols.map(l => <LangBadge key={l.suffix} label={l.label} cls={l.badge} />)}
              </div>
              <div className="grid grid-cols-3 gap-4 mb-3">
                {langCols.map(l => (
                  <div key={l.suffix}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                    <input type="text" name={`title${l.suffix}`} value={formData[`title${l.suffix}`]} onChange={handleInputChange} dir={l.dir} style={l.font ? { fontFamily: l.font } : {}} className={inputCls} />
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-4">
                {langCols.map(l => (
                  <div key={l.suffix}>
                    <label className="block text-xs font-medium text-gray-500 mb-1.5">Description</label>
                    <textarea name={`description${l.suffix}`} value={formData[`description${l.suffix}`]} onChange={handleInputChange} rows={2} dir={l.dir} style={l.font ? { fontFamily: l.font } : {}} className={inputCls} />
                  </div>
                ))}
              </div>
            </div>

            {/* Image upload */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">Archive Image</label>
              <div className="flex gap-2">
                <input type="text" name="image_url" value={formData.image_url} onChange={handleInputChange} placeholder="Image URL or upload" className={inputCls} />
                <label className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer shrink-0 shadow-md transition-all ${uploading ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900 text-white shadow-blue-900/30'}`}>
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><Upload size={14} /> Upload</>}
                  <input type="file" accept="image/*" onChange={handleImageSelect} className="hidden" disabled={uploading} />
                </label>
              </div>
              {formData.image_url ? (
                <img src={normalizePath(formData.image_url)} alt="Preview" className="mt-3 h-24 w-auto rounded-xl border border-gray-200 object-cover shadow-sm" onError={e => { e.target.style.display = 'none' }} />
              ) : (
                <div className="mt-3 flex items-center gap-2 h-14 px-4 rounded-xl border-2 border-dashed border-gray-200 text-gray-400 text-sm">
                  <ImageIcon size={15} /> No image selected
                </div>
              )}
            </div>

            {/* PDF upload */}
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-2">PDF / Document (optional)</label>
              <div className="flex gap-2">
                <input type="text" name="file_url" value={formData.file_url} onChange={handleInputChange} placeholder="File URL or upload" className={inputCls} />
                <label className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-xl cursor-pointer shrink-0 shadow-md transition-all ${uploading ? 'bg-gray-200 text-gray-500' : 'bg-gradient-to-br from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 text-white shadow-violet-900/30'}`}>
                  {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading…</> : <><FileArchive size={14} /> Upload PDF</>}
                  <input type="file" accept=".pdf,.doc,.docx" onChange={handleFileSelect} className="hidden" disabled={uploading} />
                </label>
              </div>
              {formData.file_url && (
                <p className="flex items-center gap-1.5 text-xs text-emerald-600 mt-2 font-medium">
                  <CheckCircle2 size={13} /> File uploaded
                </p>
              )}
            </div>

            <div className="flex items-center justify-between gap-3 pt-1">
              {/* Active toggle */}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, is_active: !prev.is_active }))}
                className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-xl border transition-all ${
                  formData.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                    : 'bg-gray-50 text-gray-500 border-gray-200 hover:bg-gray-100'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${formData.is_active ? 'bg-emerald-500' : 'bg-gray-400'}`} />
                {formData.is_active ? 'Active — visible on site' : 'Hidden — not on site'}
              </button>

              <div className="flex gap-3">
                <button type="button" onClick={handleCancel} className="px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-xl hover:bg-gray-50 text-gray-700 transition-colors">Cancel</button>
                <button type="submit" disabled={uploading} className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-stone-600 to-stone-800 hover:from-stone-700 hover:to-stone-900 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-stone-950/30 transition-all">
                  <CheckCircle2 size={15} />
                  {editingItem ? 'Save Changes' : 'Add Item'}
                </button>
              </div>
            </div>
          </form>
        </div>
      )}

      {/* Grid */}
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={filteredItems.map(i => i.id)} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {filteredItems.map(item => (
              <SortableCard key={item.id} item={item} categoryName={getCategoryName(item)} onEdit={handleEdit} onDelete={deleteItem} onDownloadQR={downloadQR} onToggleActive={toggleActive} />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {filteredItems.length === 0 && !isAdding && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-stone-600 to-stone-800 flex items-center justify-center shadow-lg shadow-stone-950/40 mb-4">
            <ScrollText size={24} strokeWidth={1.6} className="text-white" />
          </span>
          <p className="text-sm font-medium text-gray-500">No items in this category</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add New Item" to get started</p>
        </div>
      )}
    </div>
  )
}
