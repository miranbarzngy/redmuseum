'use client'

import { useState, useEffect } from 'react'
import { useAdminPerms, can } from '../AdminContext'

const DEFAULT_ORDER = ['slides', 'about', 'virtual-tour', 'gallery', 'archive', 'exclusive', 'messages', 'reserve']

const SECTION_META = {
  slides:          { icon: '🎠', label: 'Slides',          desc: 'Hero slider / banner images' },
  about:           { icon: 'ℹ️',  label: 'About',           desc: 'Museum information section' },
  'virtual-tour':  { icon: '👁️', label: 'VR Tour',         desc: '360° virtual tour section' },
  gallery:         { icon: '🖼️', label: 'Gallery',          desc: 'Photo gallery section' },
  archive:         { icon: '📁', label: 'Archive',          desc: 'Archive & documents section' },
  exclusive:       { icon: '⭐', label: 'Exclusive',        desc: 'Exclusive events section' },
  messages:        { icon: '💬', label: 'Messages',         desc: 'Contact form section' },
  reserve:         { icon: '🎟️', label: 'Reserve a Visit',  desc: 'Visitor reservation form' },
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
              // Merge: keep saved order but add any new sections missing from saved list
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

  const handleDragOver = (e, idx) => {
    e.preventDefault()
    if (idx !== overIdx) setOverIdx(idx)
  }

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
      if (res.ok) flash('Section order saved! Homepage will update.', true)
      else flash('Failed to save. Try again.', false)
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
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-lg font-medium">Access Denied</p>
          <p className="text-sm mt-1">You don't have permission to reorder sections.</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Section Order</h1>
          <p className="text-sm text-gray-500 mt-1">
            Drag &amp; drop (or use arrows) to set the order sections appear on the homepage
          </p>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          {msg.text && (
            <span className={`text-sm font-medium ${msg.ok ? 'text-green-600' : 'text-red-600'}`}>
              {msg.text}
            </span>
          )}
          <button
            onClick={reset}
            className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Reset Default
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {saving ? 'Saving…' : 'Save Order'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
              <span className="text-xs text-gray-500 font-semibold uppercase tracking-wider">
                Homepage top → bottom order
              </span>
              <span className="text-xs text-gray-400">— drag rows or use arrow buttons</span>
            </div>

            <div className="divide-y divide-gray-100">
              {order.map((id, idx) => {
                const meta = SECTION_META[id] || { icon: '📄', label: id, desc: '' }
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
                    className={`flex items-center gap-4 px-6 py-4 select-none transition-all duration-100 ${
                      isDragging
                        ? 'opacity-40 bg-blue-50 scale-95'
                        : isOver
                        ? 'bg-blue-50 border-l-4 border-blue-500'
                        : 'hover:bg-gray-50 border-l-4 border-transparent'
                    } cursor-grab active:cursor-grabbing`}
                  >
                    {/* Drag handle */}
                    <span className="text-gray-300 text-lg leading-none shrink-0" style={{ fontFamily: 'monospace' }}>
                      ⠿
                    </span>

                    {/* Position number */}
                    <span className="w-6 h-6 rounded-full bg-gray-100 text-gray-500 text-xs font-bold flex items-center justify-center shrink-0">
                      {idx + 1}
                    </span>

                    {/* Icon */}
                    <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-xl shrink-0">
                      {meta.icon}
                    </div>

                    {/* Label + description */}
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 text-sm">{meta.label}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{meta.desc}</p>
                    </div>

                    {/* Arrow buttons (for touch / mobile) */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button
                        onClick={() => moveUp(idx)}
                        disabled={idx === 0}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 text-xs transition-colors"
                        title="Move up"
                      >
                        ▲
                      </button>
                      <button
                        onClick={() => moveDown(idx)}
                        disabled={idx === order.length - 1}
                        className="w-6 h-6 flex items-center justify-center rounded bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed text-gray-600 text-xs transition-colors"
                        title="Move down"
                      >
                        ▼
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-700">
            <strong>Note:</strong> Hidden sections (toggled off in their respective admin pages) will still be skipped on the homepage regardless of their position here.
          </div>
        </>
      )}
    </div>
  )
}
