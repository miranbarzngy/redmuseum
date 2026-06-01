'use client'

import { useState, useEffect } from 'react'
import { ShieldAlert, Trash2, RotateCcw, Edit, PlusCircle, ArrowRightLeft, RefreshCw, Loader2, Archive } from 'lucide-react'

const ACTION_META = {
  delete:        { label: 'Deleted',       icon: Trash2,          cls: 'bg-red-100 text-red-700'     },
  archive:       { label: 'Archived',      icon: Archive,         cls: 'bg-amber-100 text-amber-700' },
  restore:       { label: 'Restored',      icon: RotateCcw,       cls: 'bg-teal-100 text-teal-700'   },
  status_change: { label: 'Status Change', icon: ArrowRightLeft,  cls: 'bg-indigo-100 text-indigo-700' },
  create:        { label: 'Created',       icon: PlusCircle,      cls: 'bg-emerald-100 text-emerald-700' },
  update:        { label: 'Updated',       icon: Edit,            cls: 'bg-blue-100 text-blue-700'   },
}

function formatDate(d) {
  return new Date(d).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function ActionBadge({ action }) {
  const meta = ACTION_META[action] || { label: action, icon: ShieldAlert, cls: 'bg-gray-100 text-gray-600' }
  const Icon = meta.icon
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${meta.cls}`}>
      <Icon size={10} strokeWidth={2.5} />
      {meta.label}
    </span>
  )
}

function EntityBadge({ entity }) {
  const colors = {
    reservations: 'bg-indigo-50 text-indigo-700',
    messages:     'bg-teal-50 text-teal-700',
    users:        'bg-violet-50 text-violet-700',
  }
  return (
    <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-semibold ${colors[entity] || 'bg-gray-100 text-gray-600'}`}>
      {entity}
    </span>
  )
}

export default function AuditLogPage() {
  const [logs,     setLogs]     = useState([])
  const [loading,  setLoading]  = useState(true)
  const [filter,   setFilter]   = useState('all')

  const loadLogs = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/audit?limit=200')
      const json = await res.json()
      setLogs(json.logs || [])
    } catch {
      setLogs([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadLogs() }, [])

  const entities = ['all', ...Array.from(new Set(logs.map(l => l.entity)))]
  const filtered = filter === 'all' ? logs : logs.filter(l => l.entity === filter)

  return (
    <div className="max-w-5xl space-y-6 pt-4 sm:pt-6">

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
        <button onClick={loadLogs} disabled={loading} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl transition-colors shadow-sm">
          {loading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
          Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl w-fit flex-wrap">
        {entities.map(e => (
          <button key={e} onClick={() => setFilter(e)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all ${filter === e ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {e}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-slate-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-400">
            <ShieldAlert size={32} className="mb-3 opacity-30" />
            <p className="text-sm">No audit events yet</p>
            <p className="text-xs mt-1">Actions like deletes, archives, and status changes will appear here</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">When</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">User</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Action</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Table</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-gray-400 uppercase tracking-wide hidden sm:table-cell">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map(log => (
                  <tr key={log.id} className="hover:bg-gray-50/60 transition-colors">
                    <td className="px-4 py-3 text-xs text-gray-400 whitespace-nowrap">{formatDate(log.created_at)}</td>
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">{log.user_email || '—'}</p>
                    </td>
                    <td className="px-4 py-3"><ActionBadge action={log.action} /></td>
                    <td className="px-4 py-3"><EntityBadge entity={log.entity} /></td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      {log.details && Object.keys(log.details).length > 0 ? (
                        <p className="text-xs text-gray-400 font-mono truncate max-w-[200px]">
                          {Object.entries(log.details).map(([k, v]) => `${k}: ${v}`).join(' · ')}
                        </p>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  )
}
