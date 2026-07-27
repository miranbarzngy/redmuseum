'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'

export default function NotificationBell() {
  const [open, setOpen]             = useState(false)
  const [notifications, setNotifs]  = useState([])
  const [unread, setUnread]         = useState(0)
  const [loading, setLoading]       = useState(false)
  const panelRef                    = useRef(null)

  const fetchNotifs = useCallback(async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    setLoading(true)

    const lastRead = localStorage.getItem('notif_last_read') || new Date(0).toISOString()

    const [{ data: reservations }, { data: messages }] = await Promise.all([
      supabase
        .from('reservations')
        .select('id, name, guest_count, date, time, created_at')
        .order('created_at', { ascending: false })
        .limit(15),
      supabase
        .from('messages')
        .select('id, name, message, created_at')
        .order('created_at', { ascending: false })
        .limit(15),
    ])

    const all = [
      ...(reservations || []).map(r => ({
        id:         'r-' + r.id,
        type:       'reservation',
        title:      r.name || '—',
        body:       `${r.guest_count} میوان • ${r.date} ${r.time}`,
        created_at: r.created_at || new Date(0).toISOString(),
        href:       '/admin/visitors',
      })),
      ...(messages || []).map(m => ({
        id:         'm-' + m.id,
        type:       'message',
        title:      m.name || '—',
        body:       (m.message || '').slice(0, 80),
        created_at: m.created_at || new Date(0).toISOString(),
        href:       '/admin/messages',
      })),
    ]
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 20)

    setNotifs(all)
    setUnread(all.filter(n => n.created_at > lastRead).length)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchNotifs()
    // re-fetch every 30 s so badge stays current
    const id = setInterval(fetchNotifs, 30000)
    return () => clearInterval(id)
  }, [fetchNotifs])

  // Close on outside click
  useEffect(() => {
    const handler = (e) => {
      if (panelRef.current && !panelRef.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  function toggleOpen() {
    const next = !open
    setOpen(next)
    if (next) {
      // mark all as read
      localStorage.setItem('notif_last_read', new Date().toISOString())
      setUnread(0)
    }
  }

  return (
    <div className="relative" ref={panelRef}>
      {/* Bell button */}
      <button
        onClick={toggleOpen}
        className="relative p-2 rounded-lg hover:bg-white/10 transition-colors"
        aria-label="Notifications"
      >
        <i className="ri-notification-3-line text-xl text-white" />
        {unread > 0 && (
          <span className="absolute top-1 right-1 min-w-[16px] h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold px-0.5">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {open && (
        <div className="absolute right-0 top-12 w-80 bg-gray-900 border border-white/10 rounded-2xl shadow-2xl z-50 overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <span className="text-white font-semibold text-sm flex items-center gap-2">
              <i className="ri-notification-3-line text-base" />
              Notifications
            </span>
            <button
              onClick={() => { fetchNotifs(); }}
              className="text-gray-400 hover:text-white transition-colors text-xs flex items-center gap-1"
            >
              <i className="ri-refresh-line" />
            </button>
          </div>

          {/* List */}
          <div className="max-h-[420px] overflow-y-auto divide-y divide-white/5">
            {loading && notifications.length === 0 && (
              <div className="py-8 text-center">
                <div className="w-5 h-5 border-2 border-gray-500 border-t-white rounded-full animate-spin mx-auto" />
              </div>
            )}
            {!loading && notifications.length === 0 && (
              <p className="text-gray-500 text-sm text-center py-8">No notifications yet</p>
            )}
            {notifications.map(n => (
              <a
                key={n.id}
                href={n.href}
                onClick={() => setOpen(false)}
                className="flex items-start gap-3 px-4 py-3 hover:bg-white/5 transition-colors"
              >
                <span className={`mt-0.5 w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                  n.type === 'reservation' ? 'bg-amber-500/15' : 'bg-teal-500/15'
                }`}>
                  <i className={`text-sm ${
                    n.type === 'reservation'
                      ? 'ri-calendar-check-line text-amber-400'
                      : 'ri-mail-line text-teal-400'
                  }`} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-white text-xs font-semibold truncate">{n.title}</p>
                  <p className="text-gray-400 text-xs truncate mt-0.5">{n.body}</p>
                  <p className="text-gray-600 text-[10px] mt-1">
                    {new Date(n.created_at).toLocaleString('en-GB', {
                      day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                    })}
                  </p>
                </div>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
