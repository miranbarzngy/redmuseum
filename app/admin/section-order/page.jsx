'use client'

import { useState, useEffect } from 'react'
import { useAdminPerms, can } from '../AdminContext'
import { logAudit } from '../../lib/auditLog'
import {
  Layers, GripVertical, ChevronUp, ChevronDown,
  RotateCcw, CheckCircle2, Loader2, Lock, Info,
} from 'lucide-react'

const DEFAULT_ORDER = ['slides', 'about', 'virtual-tour', 'gallery', 'archive', 'exclusive', 'showcase', 'messages', 'reserve']

const SECTION_META = {
  slides:         { iconCls: 'ri-home-6-line',          label: 'Slides',          desc: 'Hero slider / banner images',   grad: 'from-blue-600 to-blue-800',     shadow: 'shadow-blue-950/30' },
  about:          { iconCls: 'ri-profile-line',          label: 'About',           desc: 'Museum information section',    grad: 'from-amber-500 to-amber-700',   shadow: 'shadow-amber-950/30' },
  'virtual-tour': { iconCls: 'ri-eye-2-line',            label: 'VR Tour',         desc: '360° virtual tour section',     grad: 'from-teal-600 to-teal-800',     shadow: 'shadow-teal-950/30' },
  gallery:        { iconCls: 'ri-image-line',            label: 'Gallery',         desc: 'Photo gallery section',         grad: 'from-rose-600 to-rose-800',     shadow: 'shadow-rose-950/30' },
  archive:        { iconCls: 'ri-archive-line',          label: 'Archive',         desc: 'Archive & documents section',   grad: 'from-stone-500 to-stone-700',   shadow: 'shadow-stone-950/30' },
  exclusive:      { iconCls: 'ri-star-line',             label: 'Museum Activities', desc: 'Museum activities section',      grad: 'from-yellow-500 to-amber-700',  shadow: 'shadow-amber-950/30' },
  showcase:       { iconCls: 'ri-layout-grid-line',      label: 'Social Media',  desc: 'Social Media',  grad: 'from-fuchsia-600 to-fuchsia-800', shadow: 'shadow-fuchsia-950/30' },
  messages:       { iconCls: 'ri-contacts-book-3-line',  label: 'Messages',        desc: 'Contact form section',          grad: 'from-teal-600 to-teal-900',     shadow: 'shadow-teal-950/30' },
  reserve:        { iconCls: 'ri-calendar-check-line',   label: 'Reserve a Visit', desc: 'Visitor reservation form',      grad: 'from-indigo-600 to-indigo-800', shadow: 'shadow-indigo-950/30' },
}

export default function SectionOrderPage() {
  const { perms } = useAdminPerms()
  const [order, setOrder] = useState(DEFAULT_ORDER)
  const [dragIdx, setDragIdx] = useState(null)
  const [overIdx, setOverIdx] = useState(null)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState({ text: '', ok: true })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/settings?key=section_order')
      .then(r => r.json())
      .then(json => {
        if (json.value) {
          try {
            const parsed = JSON.parse(json.value)
            if (Array.isArray(parsed) && parsed.length > 0) {
              const missing = DEFAULT_ORDER.filter(id => !parsed.includes(id))
              setOrder([...parsed, ...missing])
            }
          } catch {}
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const flash = (text, ok = true) => {
    setMsg({ text, ok })
    setTimeout(() => setMsg({ text: '', ok: true }), 3000)
  }

  const handleDragStart = (idx) => setDragIdx(idx)
  const handleDragOver = (e, idx) => { e.preventDefault(); if (idx !== overIdx) setOverIdx(idx) }
  const handleDrop = (e, idx) => {
    e.preventDefault()
    if (dragIdx === null || dragIdx === idx) { setDragIdx(null); setOverIdx(null); return }
    const next = [...order]
    const [moved] = next.splice(dragIdx, 1)
    next.splice(idx, 0, moved)
    setOrder(next)
    setDragIdx(null)
    setOverIdx(null)
  }
  const handleDragEnd = () => { setDragIdx(null); setOverIdx(null) }

  const moveUp = (idx) => {
    if (idx === 0) return
    const next = [...order]
    ;[next[idx - 1], next[idx]] = [next[idx], next[idx - 1]]
    setOrder(next)
  }

  const moveDown = (idx) => {
    if (idx === order.length - 1) return
    const next = [...order]
    ;[next[idx], next[idx + 1]] = [next[idx + 1], next[idx]]
    setOrder(next)
  }

  const save = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'section_order', value: JSON.stringify(order) }),
      })
      if (res.ok) {
        logAudit('update', 'settings', 'section_order', { order: order.join(',') })
        flash('Section order saved! Homepage will update.', true)
      } else flash('Failed to save. Try again.', false)
    } catch {
      flash('Network error. Try again.', false)
    } finally {
      setSaving(false)
    }
  }

  const reset = () => setOrder(DEFAULT_ORDER)

  if (!can(perms, 'section_order', 'edit')) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-gray-400">
          <span className="w-16 h-16 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-950/40 mx-auto mb-4">
            <Lock size={24} strokeWidth={1.6} className="text-white" />
          </span>
          <p className="text-lg font-semibold text-gray-700">Access Denied</p>
          <p className="text-sm text-gray-400 mt-1">You don't have permission to reorder sections.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-emerald-900 flex items-center justify-center shadow-lg shadow-emerald-950/40">
            <Layers size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Section Order</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              Drag &amp; drop (or use arrows) to set the order sections appear on the homepage
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {msg.text && (
            <span className={`text-sm font-medium ${msg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
              {msg.text}
            </span>
          )}
          <button
            onClick={reset}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-gray-600 bg-white border border-gray-200 hover:bg-gray-50 rounded-xl shadow-sm transition-colors"
          >
            <RotateCcw size={13} />
            Reset Default
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 disabled:opacity-50 text-white rounded-xl shadow-md shadow-emerald-950/30 transition-all"
          >
            {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          {/* Order list */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/60 flex items-center gap-2">
              <Layers size={13} className="text-emerald-600" />
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                Homepage top → bottom order
              </span>
              <span className="text-xs text-gray-400">— drag rows or use arrow buttons</span>
            </div>

            <div className="divide-y divide-gray-50">
              {order.map((id, idx) => {
                const meta = SECTION_META[id] || { iconCls: 'ri-layout-line', label: id, desc: '', grad: 'from-gray-500 to-gray-700', shadow: 'shadow-gray-950/30' }
                const isDragging = dragIdx === idx
                const isOver = overIdx === idx && dragIdx !== idx

                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={() => handleDragStart(idx)}
                    onDragOver={(e) => handleDragOver(e, idx)}
                    onDrop={(e) => handleDrop(e, idx)}
                    onDragEnd={handleDragEnd}
                    className={`flex items-center gap-4 px-5 py-4 select-none transition-all duration-100 ${
                      isDragging
                        ? 'opacity-40 bg-emerald-50 scale-[0.98]'
                        : isOver
                        ? 'bg-emerald-50 border-l-[3px] border-emerald-500'
                        : 'hover:bg-gray-50/60 border-l-[3px] border-transparent'
                    } cursor-grab active:cursor-grabbing`}
                  >
                    {/* Drag handle */}
                    <GripVertical size={16} className="text-gray-300 shrink-0" />

                    {/* Position number */}
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Section icon badge */}
                    <span className={`w-10 h-10 rounded-xl bg-gradient-to-br ${meta.grad} flex items-center justify-center shadow ${meta.shadow} shrink-0`}>
                      <i className={`${meta.iconCls} text-white text-base leading-none`} />
                    </span>

                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{meta.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                    </div>

                    {/* Arrow buttons */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed text-gray-600 transition-colors"
                        title="Move up"
                      >
                        <ChevronUp size={13} />
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === order.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-25 disabled:cursor-not-allowed text-gray-600 transition-colors"
                        title="Move down"
                      >
                        <ChevronDown size={13} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Note */}
          <div className="mt-4 flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-2xl text-sm text-amber-700">
            <Info size={15} className="text-amber-500 shrink-0 mt-0.5" />
            <p>
              <strong>Note:</strong> Hidden sections (toggled off in their respective admin pages) will still be skipped on the homepage regardless of their position here.
            </p>
          </div>
        </>
      )}

    </div>
  )
}
