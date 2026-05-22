'use client'

import { useEffect, useRef, useState } from 'react'
import { LayoutGrid, Plus, Trash2, ChevronUp, ChevronDown, Loader2, CheckCircle2, Edit3, X, ExternalLink } from 'lucide-react'
import Image from 'next/image'
import VisibilityToggle from '../components/VisibilityToggle'

const EMPTY_FORM = { title_ku: '', title_en: '', title_ar: '', image_url: '', redirect_url: '' }

export default function ShowcaseCardsPage() {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: true })
  const [showForm, setShowForm] = useState(false)
  const [editCard, setEditCard] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef()

  const flash = (text, ok = true) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg({ text: '', ok: true }), 3500)
  }

  const load = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/showcase-cards')
      const json = await res.json()
      // Admin needs all cards incl inactive — fetch all via service key isn't available client-side,
      // so we use the public GET but show inactive via local state tracking
      setCards(json.cards || [])
    } catch { flash('Failed to load cards', false) }
    finally { setLoading(false) }
  }

  useEffect(() => { load() }, [])

  const openAdd = () => { setEditCard(null); setForm(EMPTY_FORM); setShowForm(true) }
  const openEdit = (card) => { setEditCard(card); setForm({ title_ku: card.title_ku, title_en: card.title_en, title_ar: card.title_ar, image_url: card.image_url, redirect_url: card.redirect_url }); setShowForm(true) }
  const closeForm = () => { setShowForm(false); setEditCard(null); setForm(EMPTY_FORM) }

  const uploadImage = async (file) => {
    setUploading(true)
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('bucket', 'showcase')
      fd.append('prefix', 'card_')
      const res = await fetch('/api/upload', { method: 'POST', body: fd })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      setForm(f => ({ ...f, image_url: json.url }))
    } catch (e) { flash(e.message || 'Upload failed', false) }
    finally { setUploading(false) }
  }

  const save = async () => {
    if (!form.image_url) { flash('Please upload an image', false); return }
    setSaving(true)
    try {
      const method = editCard ? 'PATCH' : 'POST'
      const body = editCard ? { id: editCard.id, ...form } : { ...form, order_index: cards.length }
      const res = await fetch('/api/showcase-cards', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error)
      flash(editCard ? 'Card updated' : 'Card added')
      closeForm()
      load()
    } catch (e) { flash(e.message || 'Save failed', false) }
    finally { setSaving(false) }
  }

  const remove = async (id) => {
    if (!confirm('Delete this card?')) return
    try {
      const res = await fetch(`/api/showcase-cards?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error()
      flash('Card deleted')
      load()
    } catch { flash('Delete failed', false) }
  }

  const moveCard = async (idx, dir) => {
    const target = idx + dir
    if (target < 0 || target >= cards.length) return
    const reordered = [...cards]
    ;[reordered[idx], reordered[target]] = [reordered[target], reordered[idx]]
    setCards(reordered)
    // persist new order_index values
    await Promise.all(reordered.map((c, i) =>
      fetch('/api/showcase-cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: c.id, order_index: i }),
      })
    ))
  }

  const toggleActive = async (card) => {
    try {
      await fetch('/api/showcase-cards', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: card.id, is_active: !card.is_active }),
      })
      load()
    } catch { flash('Failed to update', false) }
  }

  return (
    <div className="max-w-4xl mx-auto pt-8 pb-16">

      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-fuchsia-600 to-fuchsia-900 flex items-center justify-center shadow-lg shadow-fuchsia-950/40">
            <LayoutGrid size={19} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Social Media Post</h1>
            <p className="text-xs text-gray-400">Portrait cards (9:16) with link redirect</p>
          </div>
        </div>
        <button
          onClick={openAdd}
          className="flex items-center gap-2 px-4 py-2 bg-[#7a0000] hover:bg-[#a00000] text-white rounded-xl text-sm font-semibold transition-colors shadow"
        >
          <Plus size={16} /> Add Card
        </button>
      </div>

      {/* Visibility toggle */}
      <div className="mb-6">
        <VisibilityToggle settingKey="show_showcase" label="Social Media Post Section" description="Show or hide the showcase cards section on the homepage" />
      </div>

      {/* Toast */}
      {msg.text && (
        <div className={`mb-4 flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium ${msg.ok ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.ok ? <CheckCircle2 size={16} /> : <X size={16} />}
          {msg.text}
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="mb-6 bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
            <h3 className="font-bold text-gray-800">{editCard ? 'Edit Card' : 'New Card'}</h3>
            <button onClick={closeForm} className="text-gray-400 hover:text-gray-700 transition-colors">
              <X size={18} />
            </button>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">

            {/* Image upload */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Card Image (9:16 portrait)</label>
              <div className="flex items-start gap-4">
                {form.image_url ? (
                  <div className="relative flex-shrink-0 rounded-xl overflow-hidden border border-gray-200 bg-gray-50" style={{ width: 90, height: 160 }}>
                    <Image src={form.image_url} alt="preview" fill className="object-cover" unoptimized />
                  </div>
                ) : (
                  <div className="flex-shrink-0 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50 flex items-center justify-center text-gray-400 text-xs" style={{ width: 90, height: 160 }}>
                    9:16
                  </div>
                )}
                <div className="flex-1">
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => e.target.files[0] && uploadImage(e.target.files[0])} />
                  <button
                    onClick={() => fileRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-xl text-sm text-gray-600 hover:border-gray-400 transition-colors disabled:opacity-50"
                  >
                    {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
                    {uploading ? 'Uploading…' : form.image_url ? 'Change Image' : 'Upload Image'}
                  </button>
                  <p className="text-xs text-gray-400 mt-1.5">Best size: 1080×1920px · Max 10 MB</p>
                  {form.image_url && (
                    <input
                      value={form.image_url}
                      onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))}
                      className="mt-2 w-full text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-500"
                      placeholder="Or paste image URL"
                    />
                  )}
                </div>
              </div>
            </div>

            {/* Redirect URL */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Redirect URL</label>
              <input
                value={form.redirect_url}
                onChange={e => setForm(f => ({ ...f, redirect_url: e.target.value }))}
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                placeholder="https://example.com/page"
              />
            </div>

            {/* Titles */}
            {[
              { key: 'title_ku', label: 'Title (Kurdish)', dir: 'rtl', font: 'UniSalar, Tahoma, sans-serif', badge: 'bg-emerald-50 text-emerald-700' },
              { key: 'title_en', label: 'Title (English)', dir: 'ltr', font: '', badge: 'bg-blue-50 text-blue-700' },
              { key: 'title_ar', label: 'Title (Arabic)',  dir: 'rtl', font: 'Cairo, Tahoma, sans-serif',    badge: 'bg-amber-50 text-amber-700' },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5 flex items-center gap-2">
                  {f.label}
                  <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${f.badge}`}>{f.key.split('_')[1].toUpperCase()}</span>
                </label>
                <input
                  value={form[f.key]}
                  onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                  dir={f.dir}
                  style={f.font ? { fontFamily: f.font } : {}}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:border-red-400"
                  placeholder={`Card title in ${f.label.split(' ')[2] || f.label}`}
                />
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-end gap-3">
            <button onClick={closeForm} className="px-4 py-2 rounded-xl border border-gray-200 text-sm text-gray-600 hover:bg-gray-100 transition-colors">Cancel</button>
            <button
              onClick={save}
              disabled={saving || !form.image_url}
              className="flex items-center gap-2 px-5 py-2 bg-[#7a0000] hover:bg-[#a00000] text-white rounded-xl text-sm font-semibold disabled:opacity-50 transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
              {editCard ? 'Update Card' : 'Add Card'}
            </button>
          </div>
        </div>
      )}

      {/* Cards list */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={28} className="animate-spin text-gray-300" />
        </div>
      ) : cards.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <LayoutGrid size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No cards yet. Add your first card.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cards.map((card, idx) => (
            <div key={card.id} className={`bg-white rounded-2xl border flex items-center gap-4 p-4 transition-all ${card.is_active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>

              {/* Thumbnail */}
              <div className="flex-shrink-0 relative rounded-xl overflow-hidden border border-gray-100 bg-gray-50" style={{ width: 52, height: 93 }}>
                <Image src={card.image_url} alt={card.title_en || 'card'} fill className="object-cover" unoptimized />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800 text-sm truncate" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }} dir="rtl">
                  {card.title_ku || card.title_en || '—'}
                </p>
                {card.title_en && card.title_ku !== card.title_en && (
                  <p className="text-xs text-gray-400 truncate">{card.title_en}</p>
                )}
                {card.redirect_url && (
                  <p className="text-[11px] text-blue-400 truncate flex items-center gap-1 mt-0.5">
                    <ExternalLink size={10} /> {card.redirect_url}
                  </p>
                )}
              </div>

              {/* Active toggle */}
              <button
                onClick={() => toggleActive(card)}
                className={`flex-shrink-0 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-colors ${
                  card.is_active
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-gray-50 text-gray-400 border-gray-200'
                }`}
              >
                {card.is_active ? 'Active' : 'Hidden'}
              </button>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1">
                <button onClick={() => moveCard(idx, -1)} disabled={idx === 0} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-25">
                  <ChevronUp size={16} />
                </button>
                <button onClick={() => moveCard(idx, 1)} disabled={idx === cards.length - 1} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 disabled:opacity-25">
                  <ChevronDown size={16} />
                </button>
                <button onClick={() => openEdit(card)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                  <Edit3 size={15} />
                </button>
                <button onClick={() => remove(card.id)} className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
