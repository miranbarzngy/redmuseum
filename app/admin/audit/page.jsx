'use client'

import { useState, useEffect, useCallback } from 'react'
import {
  ShieldAlert, Trash2, RotateCcw, Edit, PlusCircle, ArrowRightLeft,
  RefreshCw, Loader2, Archive, Eye, X, UserRound, Clock, Search,
  Filter, TrendingUp,
} from 'lucide-react'

/* ── Constants ─────────────────────────────────────────────────── */

const ACTION_META = {
  delete:        { label: 'Deleted',       icon: Trash2,          cls: 'bg-red-100 text-red-700',       dot: 'bg-red-500'     },
  archive:       { label: 'Archived',      icon: Archive,         cls: 'bg-amber-100 text-amber-700',   dot: 'bg-amber-500'   },
  restore:       { label: 'Restored',      icon: RotateCcw,       cls: 'bg-teal-100 text-teal-700',     dot: 'bg-teal-500'    },
  status_change: { label: 'Status',        icon: ArrowRightLeft,  cls: 'bg-indigo-100 text-indigo-700', dot: 'bg-indigo-500'  },
  create:        { label: 'Created',       icon: PlusCircle,      cls: 'bg-emerald-100 text-emerald-700', dot: 'bg-emerald-500' },
  update:        { label: 'Updated',       icon: Edit,            cls: 'bg-blue-100 text-blue-700',     dot: 'bg-blue-500'    },
}

const ENTITY_COLORS = {
  reservations:      'bg-indigo-50 text-indigo-700 border-indigo-100',
  messages:          'bg-teal-50 text-teal-700 border-teal-100',
  users:             'bg-violet-50 text-violet-700 border-violet-100',
  settings:          'bg-gray-100 text-gray-700 border-gray-200',
  slides:            'bg-blue-50 text-blue-700 border-blue-100',
  gallery:           'bg-rose-50 text-rose-700 border-rose-100',
  digital_archive:   'bg-stone-100 text-stone-700 border-stone-200',
  exclusive_slides:  'bg-yellow-50 text-yellow-700 border-yellow-100',
  showcase_cards:    'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-100',
}

/* ── Helpers ───────────────────────────────────────────────────── */

function formatDate(d) {
  return new Date(d).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function formatDateFull(d) {
  return new Date(d).toLocaleString('en-GB', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

function timeAgo(d) {
  const diff = (Date.now() - new Date(d).getTime()) / 1000
  if (diff < 60)    return 'just now'
  if (diff < 3600)  return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`
  return formatDate(d)
}

function initials(name) {
  if (!name) return null
  return name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

const AVATAR_GRADS = [
  'from-violet-500 to-violet-700',
  'from-blue-500 to-blue-700',
  'from-emerald-500 to-emerald-700',
  'from-rose-500 to-rose-700',
  'from-amber-500 to-amber-700',
  'from-indigo-500 to-indigo-700',
  'from-teal-500 to-teal-700',
]
function avatarGrad(email = '') {
  let h = 0
  for (const c of email) h = (h * 31 + c.charCodeAt(0)) & 0xffff
  return AVATAR_GRADS[h % AVATAR_GRADS.length]
}

/* ── Sub-components ────────────────────────────────────────────── */

function ActionBadge({ action }) {
  const meta = ACTION_META[action] || { label: action, icon: ShieldAlert, cls: 'bg-gray-100 text-gray-600' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${meta.cls}`}>
      <Icon size={10} strokeWidth={2.5} />
      {meta.label}
    </span>
  )
}

function EntityBadge({ entity }) {
  const cls = ENTITY_COLORS[entity] || 'bg-gray-100 text-gray-600 border-gray-200'
  return (
    <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-semibold border ${cls}`}>
      {entity}
    </span>
  )
}

function UserAvatar({ name, email, size = 8 }) {
  const grad = avatarGrad(email)
  const ini  = initials(name)
  const sz   = size === 8 ? 'w-8 h-8 text-xs' : 'w-9 h-9 text-sm'
  return (
    <div className={`${sz} rounded-full bg-gradient-to-br ${grad} flex items-center justify-center text-white font-bold shrink-0`}>
      {ini || <UserRound size={size === 8 ? 13 : 15} />}
    </div>
  )
}

/* ── Detail Modal ──────────────────────────────────────────────── */

function DetailModal({ log, onClose }) {
  if (!log) return null
  const details    = log.details && typeof log.details === 'object' ? log.details : {}
  const hasDetails = Object.keys(details).length > 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1.5 rounded-full bg-gray-200" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center shadow">
              <ShieldAlert size={14} className="text-white" />
            </span>
            <div>
              <h2 className="font-semibold text-gray-800 text-sm">Audit Event</h2>
              <p className="text-xs text-gray-400">{timeAgo(log.created_at)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4 max-h-[65vh] overflow-y-auto">

          {/* When */}
          <div className="flex items-start gap-3 p-3.5 bg-gray-50 rounded-xl">
            <Clock size={15} className="text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-0.5">When</p>
              <p className="text-sm text-gray-800 font-medium">{formatDateFull(log.created_at)}</p>
            </div>
          </div>

          {/* User */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Performed by</p>
            <div className="flex items-center gap-3 p-3.5 bg-gray-50 rounded-xl">
              <UserAvatar name={log.user_name} email={log.user_email} size={9} />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-800 truncate">
                  {log.user_name || <span className="text-gray-400 italic font-normal">No name</span>}
                </p>
                <p className="text-xs text-gray-400 truncate">{log.user_email || '—'}</p>
              </div>
            </div>
          </div>

          {/* Action + Table */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Action</p>
              <ActionBadge action={log.action} />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Table</p>
              <EntityBadge entity={log.entity} />
            </div>
          </div>

          {/* Entity ID */}
          {log.entity_id && (
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Record ID</p>
              <p className="text-xs font-mono text-gray-500 bg-gray-50 border border-gray-100 px-3 py-2.5 rounded-xl break-all">{log.entity_id}</p>
            </div>
          )}

          {/* Details */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Details</p>
            {hasDetails ? (
              <div className="rounded-xl border border-gray-100 overflow-hidden">
                {Object.entries(details).map(([k, v], i, arr) => (
                  <div key={k} className={`flex items-start gap-3 px-3.5 py-2.5 ${i % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'} ${i < arr.length - 1 ? 'border-b border-gray-100' : ''}`}>
                    <span className="text-xs font-semibold text-gray-500 w-28 shrink-0 pt-0.5">{k}</span>
                    <span className="text-xs text-gray-800 break-all">{String(v)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-gray-300 italic px-1">No additional details recorded</p>
            )}
          </div>

        </div>

        <div className="px-5 pb-5 pt-3">
          <button
            onClick={onClose}
            className="w-full py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}

/* ── Stats bar ─────────────────────────────────────────────────── */

function StatsBar({ logs }) {
  const total   = logs.length
  const creates = logs.filter(l => l.action === 'create').length
  const updates = logs.filter(l => l.action === 'update').length
  const deletes = logs.filter(l => l.action === 'delete').length
  const others  = total - creates - updates - deletes

  const items = [
    { label: 'Total Events',  value: total,   cls: 'text-gray-800',     bg: 'bg-gray-50 border-gray-100' },
    { label: 'Created',       value: creates, cls: 'text-emerald-700',  bg: 'bg-emerald-50 border-emerald-100' },
    { label: 'Updated',       value: updates, cls: 'text-blue-700',     bg: 'bg-blue-50 border-blue-100' },
    { label: 'Deleted',       value: deletes, cls: 'text-red-700',      bg: 'bg-red-50 border-red-100' },
    { label: 'Other',         value: others,  cls: 'text-amber-700',    bg: 'bg-amber-50 border-amber-100' },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
      {items.map(({ label, value, cls, bg }) => (
        <div key={label} className={`rounded-2xl border p-3.5 ${bg}`}>
          <p className={`text-2xl font-bold ${cls}`}>{value}</p>
          <p className="text-xs text-gray-500 mt-0.5">{label}</p>
        </div>
      ))}
    </div>
  )
}

/* ── Mobile card ───────────────────────────────────────────────── */

function LogCard({ log, onView }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
      {/* Top row: action + table + time */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 flex-wrap">
          <ActionBadge action={log.action} />
          <EntityBadge entity={log.entity} />
        </div>
        <span className="text-xs text-gray-400 whitespace-nowrap shrink-0 mt-1">{timeAgo(log.created_at)}</span>
      </div>

      {/* User row */}
      <div className="flex items-center gap-2.5">
        <UserAvatar name={log.user_name} email={log.user_email} size={8} />
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{log.user_name || <span className="text-gray-400 italic text-xs">No name</span>}</p>
          <p className="text-xs text-gray-400 truncate">{log.user_email || '—'}</p>
        </div>
        <button
          onClick={() => onView(log)}
          className="ml-auto w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 shrink-0 transition-colors"
        >
          <Eye size={14} />
        </button>
      </div>

      {/* Details preview */}
      {log.details && Object.keys(log.details).length > 0 && (
        <p className="text-xs text-gray-400 font-mono bg-gray-50 rounded-lg px-3 py-2 truncate">
          {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
        </p>
      )}
    </div>
  )
}

/* ── Main page ─────────────────────────────────────────────────── */

export default function AuditLogPage() {
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [entity,   setEntity]   = useState('all')
  const [action,   setAction]   = useState('all')
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState(null)

  const loadLogs = useCallback(async () => {
    setLoading(true)
    try {
      const res  = await fetch('/api/admin/audit?limit=200')
      const json = await res.json()
      setLogs(json.logs || [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadLogs() }, [loadLogs])

  const entities = ['all', ...Array.from(new Set(logs.map(l => l.entity)))]
  const actions  = ['all', ...Object.keys(ACTION_META)]

  const filtered = logs.filter(l => {
    if (entity !== 'all' && l.entity !== entity) return false
    if (action !== 'all' && l.action !== action) return false
    if (search) {
      const q = search.toLowerCase()
      if (
        !(l.user_email || '').toLowerCase().includes(q) &&
        !(l.user_name  || '').toLowerCase().includes(q) &&
        !(l.entity     || '').toLowerCase().includes(q) &&
        !(l.action     || '').toLowerCase().includes(q)
      ) return false
    }
    return true
  })

  return (
    <div className="max-w-5xl space-y-5 pt-4 sm:pt-6 pb-8">

      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-900 flex items-center justify-center shadow-lg shadow-slate-950/40 shrink-0">
            <ShieldAlert size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Audit Log</h1>
            <p className="text-sm text-gray-400 mt-0.5">Admin action history — last 200 events</p>
          </div>
        </div>
        <button
          onClick={loadLogs}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm disabled:opacity-60"
        >
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Stats */}
      {!loading && logs.length > 0 && <StatsBar logs={logs} />}

      {/* Filters */}
      <div className="space-y-2.5">
        {/* Search */}
        <div className="relative">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by user, table or action…"
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl bg-white focus:outline-none focus:ring-2 focus:ring-slate-400/30 focus:border-slate-400 placeholder-gray-400"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          )}
        </div>

        {/* Entity tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 mr-1">
            <Filter size={11} /> Table:
          </span>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
            {entities.map(e => (
              <button
                key={e}
                onClick={() => setEntity(e)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${entity === e ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        {/* Action tabs */}
        <div className="flex items-center gap-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs font-semibold text-gray-400 mr-1">
            <TrendingUp size={11} /> Action:
          </span>
          <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl flex-wrap">
            {actions.map(a => {
              const meta = ACTION_META[a]
              return (
                <button
                  key={a}
                  onClick={() => setAction(a)}
                  className={`flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${action === a ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  {meta && <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />}
                  {a === 'all' ? 'All' : (ACTION_META[a]?.label || a)}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* Result count */}
      {!loading && (
        <p className="text-xs text-gray-400">
          {filtered.length === logs.length
            ? `${logs.length} events`
            : `${filtered.length} of ${logs.length} events`}
        </p>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center h-48">
          <div className="w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Empty */}
      {!loading && filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400 bg-white rounded-2xl border border-gray-100">
          <ShieldAlert size={32} className="mb-3 opacity-20" />
          <p className="text-sm font-medium text-gray-500">No events found</p>
          <p className="text-xs mt-1">Try adjusting your filters or search</p>
        </div>
      )}

      {/* Mobile cards (< md) */}
      {!loading && filtered.length > 0 && (
        <div className="md:hidden space-y-3">
          {filtered.map(log => (
            <LogCard key={log.id} log={log} onView={setSelected} />
          ))}
        </div>
      )}

      {/* Desktop table (md+) */}
      {!loading && filtered.length > 0 && (
        <div className="hidden md:block bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide w-36">When</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Table</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Details</th>
                  <th className="px-4 py-3 w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-slate-50/60 transition-colors group">
                    {/* When */}
                    <td className="px-4 py-3">
                      <p className="text-xs font-medium text-gray-600 whitespace-nowrap">{formatDate(log.created_at).split(',')[0]}</p>
                      <p className="text-xs text-gray-400 whitespace-nowrap">{formatDate(log.created_at).split(',')[1]?.trim()}</p>
                    </td>
                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <UserAvatar name={log.user_name} email={log.user_email} size={8} />
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-800 truncate max-w-[130px]">
                            {log.user_name || <span className="text-gray-400 italic text-xs">—</span>}
                          </p>
                          <p className="text-xs text-gray-400 truncate max-w-[130px]">{log.user_email || '—'}</p>
                        </div>
                      </div>
                    </td>
                    {/* Action */}
                    <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                    {/* Table */}
                    <td className="px-4 py-3"><EntityBadge entity={log.entity} /></td>
                    {/* Details */}
                    <td className="px-4 py-3 max-w-[220px]">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <p className="text-xs text-gray-400 font-mono truncate">
                          {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-200">—</span>
                      )}
                    </td>
                    {/* View */}
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(log)}
                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-slate-200 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors opacity-0 group-hover:opacity-100"
                        title="View details"
                      >
                        <Eye size={13} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Detail modal */}
      {selected && <DetailModal log={selected} onClose={() => setSelected(null)} />}

    </div>
  )
}
