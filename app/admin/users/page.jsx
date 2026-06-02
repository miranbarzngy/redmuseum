'use client'

import { useState, useEffect } from 'react'
import {
  ShieldCheck, Users, Key, UserPlus, Pencil, Trash2,
  ChevronRight, CheckCircle2, Loader2, X, Plus,
  AtSign, UserRound, ShieldAlert,
  LayoutDashboard, Monitor, Mail, Landmark, Frame, ScrollText,
  Crown, Ticket, Layers, LayoutGrid, Globe, Settings, ClipboardList,
} from 'lucide-react'
import { logAudit } from '../../lib/auditLog'

const SECTIONS = [
  'dashboard','slides','messages','about','gallery','archive',
  'exclusive','visitors','section_order','showcase_cards',
  'languages','users','settings','audit',
]
const SECTION_LABELS = {
  dashboard:     'Dashboard',
  slides:        'Slides',
  messages:      'Messages',
  about:         'About',
  gallery:       'Gallery',
  archive:       'Archive',
  exclusive:     'Museum Activities',
  visitors:      'Visitors',
  section_order: 'Section Order',
  showcase_cards:'Social Media Post',
  languages:     'Languages',
  users:         'Users & Roles',
  settings:      'Museum Settings',
  audit:         'Audit Log',
}
const SECTION_META = {
  dashboard:     { Icon: LayoutDashboard, grad: 'from-slate-500 to-slate-700'    },
  slides:        { Icon: Monitor,         grad: 'from-blue-600 to-blue-800'       },
  messages:      { Icon: Mail,            grad: 'from-teal-500 to-teal-800'       },
  about:         { Icon: Landmark,        grad: 'from-amber-500 to-amber-700'     },
  gallery:       { Icon: Frame,           grad: 'from-rose-600 to-rose-800'       },
  archive:       { Icon: ScrollText,      grad: 'from-stone-500 to-stone-700'     },
  exclusive:     { Icon: Crown,           grad: 'from-yellow-500 to-amber-600'    },
  visitors:      { Icon: Ticket,          grad: 'from-indigo-500 to-indigo-800'   },
  section_order: { Icon: Layers,          grad: 'from-emerald-600 to-emerald-800' },
  showcase_cards:{ Icon: LayoutGrid,      grad: 'from-fuchsia-500 to-fuchsia-800' },
  languages:     { Icon: Globe,           grad: 'from-sky-500 to-sky-800'         },
  users:         { Icon: ShieldCheck,     grad: 'from-violet-600 to-violet-800'   },
  settings:      { Icon: Settings,        grad: 'from-indigo-500 to-indigo-800'   },
  audit:         { Icon: ClipboardList,   grad: 'from-slate-500 to-slate-700'     },
}

const EMPTY_PERMS = () =>
  Object.fromEntries(SECTIONS.map(s => [s, { view: false }]))

const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-violet-400 text-gray-800 placeholder-gray-400'

// ── Toggle switch ─────────────────────────────────────────
function Toggle({ on }) {
  return (
    <span className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-200 ${on ? 'bg-emerald-500' : 'bg-gray-200'}`}>
      <span className={`inline-block h-3.5 w-3.5 rounded-full bg-white shadow-sm transition-transform duration-200 ${on ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
    </span>
  )
}

// ── Permission Matrix ─────────────────────────────────────
function PermMatrix({ perms, onChange, disabled }) {
  const p = { ...EMPTY_PERMS(), ...perms }
  const enabledCount = SECTIONS.filter(s => !!p[s]?.view).length
  const toggle = (section, val) => !disabled && onChange({ ...p, [section]: { view: val } })

  return (
    <div className="space-y-3">
      {/* Header bar */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">
          <span className="font-semibold text-gray-700">{enabledCount}</span> of {SECTIONS.length} sections enabled
        </span>
        {!disabled && (
          <div className="flex items-center gap-3">
            <button type="button"
              onClick={() => onChange(Object.fromEntries(SECTIONS.map(s => [s, { view: true }])))}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors">
              Select all
            </button>
            <span className="text-gray-200 select-none">|</span>
            <button type="button"
              onClick={() => onChange(EMPTY_PERMS())}
              className="text-xs font-semibold text-gray-400 hover:text-gray-600 transition-colors">
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {SECTIONS.map(s => {
          const { Icon, grad } = SECTION_META[s] || { Icon: Settings, grad: 'from-gray-500 to-gray-700' }
          const on = !!p[s]?.view
          return (
            <button
              key={s}
              type="button"
              onClick={() => toggle(s, !on)}
              disabled={disabled}
              className={`flex items-center gap-3 px-3.5 py-3 rounded-xl border text-left transition-all duration-150 ${
                on
                  ? 'bg-emerald-50 border-emerald-200 shadow-sm shadow-emerald-100'
                  : 'bg-white border-gray-100 hover:border-gray-200 hover:bg-gray-50/60'
              } ${disabled ? 'cursor-default' : 'cursor-pointer'}`}
            >
              <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-md ${on ? '' : 'opacity-60'} transition-opacity`}>
                <Icon size={15} strokeWidth={2} className="text-white" />
              </span>
              <span className={`flex-1 text-sm font-medium transition-colors ${on ? 'text-gray-900' : 'text-gray-500'}`}>
                {SECTION_LABELS[s]}
              </span>
              <Toggle on={on} />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// ── Roles List with expand/collapse ──────────────────────
function RolesList({ roles, deletingRole, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState({})
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="divide-y divide-gray-50">
      {roles.map(role => (
        <div key={role.id}>
          <div
            className="flex items-center justify-between px-5 py-4 hover:bg-gray-50/60 cursor-pointer transition-colors"
            onClick={() => toggle(role.id)}
          >
            <div className="flex items-center gap-3 min-w-0">
              <ChevronRight
                size={14}
                className={`text-gray-400 transition-transform duration-200 shrink-0 ${expanded[role.id] ? 'rotate-90' : ''}`}
              />
              <span className="font-semibold text-gray-800 capitalize">{role.name}</span>
              {role.description && <span className="text-xs text-gray-400 truncate">{role.description}</span>}
              {!expanded[role.id] && (() => {
                const count = Object.values(role.permissions || {}).filter(p => p.view).length
                return count > 0 ? (
                  <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 ml-1">
                    {count} section{count !== 1 ? 's' : ''}
                  </span>
                ) : null
              })()}
            </div>
            <div className="flex items-center gap-2 shrink-0" onClick={e => e.stopPropagation()}>
              <button
                onClick={() => onEdit(role)}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
              >
                <Pencil size={11} /> Edit
              </button>
              <button
                onClick={() => onDelete(role.id)}
                disabled={deletingRole === role.id}
                className="flex items-center gap-1 px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
              >
                <Trash2 size={11} /> {deletingRole === role.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>

          {expanded[role.id] && (
            <div className="px-5 pb-5 bg-gray-50/60 border-t border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider py-3">Permissions Matrix</p>
              <PermMatrix perms={role.permissions} onChange={() => {}} disabled />
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

// ── Edit Role Modal ───────────────────────────────────────
function EditRoleModal({ role, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: role.name,
    description: role.description || '',
    permissions: { ...EMPTY_PERMS(), ...role.permissions },
  })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const save = async (e) => {
    e.preventDefault()
    setSaving(true); setErr('')
    const res = await fetch('/api/admin/roles', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: role.id, ...form }),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(json.error); return }
    onSaved(json.role)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shadow shadow-violet-950/30">
            <Key size={14} strokeWidth={1.8} className="text-white" />
          </span>
          <h3 className="font-bold text-gray-900 flex-1">Edit Role</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={save} className="p-6 space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Name</label>
              <input value={form.name} required
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
              <input value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions</label>
            <PermMatrix perms={form.permissions} onChange={p => setForm(prev => ({ ...prev, permissions: p }))} />
          </div>
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Edit User Modal ───────────────────────────────────────
function EditUserModal({ user, roles, onClose, onSaved }) {
  const [form, setForm] = useState({ email: user.email, full_name: user.full_name || '', password: '', role: user.role })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const selectedRole = roles.find(r => r.name === form.role)

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    const body = { id: user.id, email: form.email, role: form.role, full_name: form.full_name }
    if (form.password) body.password = form.password
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    })
    const json = await res.json()
    setSaving(false)
    if (!res.ok) { setErr(json.error); return }
    onSaved(json.user)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-gray-100">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shadow shadow-violet-950/30">
            <Pencil size={14} strokeWidth={1.8} className="text-white" />
          </span>
          <h3 className="font-bold text-gray-900 flex-1">Edit User</h3>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
              <input type="text" value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="Full Name"
                className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
              <input type="email" required value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                className={inputCls} />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">
              New Password <span className="text-gray-400 normal-case font-normal">(leave blank to keep current)</span>
            </label>
            <input type="password" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••" autoComplete="new-password"
              className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className={inputCls}>
              {roles.map(r => <option key={r.id} value={r.name}>{r.name} — {r.description}</option>)}
            </select>
          </div>
          {selectedRole && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Role Permissions (read-only)</label>
              <PermMatrix perms={selectedRole.permissions} onChange={() => {}} disabled />
            </div>
          )}
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-all">
              {saving ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 text-gray-600 text-sm font-semibold rounded-xl hover:bg-gray-50 transition-colors">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Main Page ─────────────────────────────────────────────
export default function UsersPage() {
  const [tab, setTab] = useState('users')
  const [users, setUsers] = useState([])
  const [roles, setRoles] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [loadingRoles, setLoadingRoles] = useState(true)
  const [forbidden, setForbidden] = useState(false)

  const [userForm, setUserForm] = useState({ email: '', full_name: '', password: '', role: '' })
  const [userMsg, setUserMsg] = useState({ text: '', ok: true })
  const [savingUser, setSavingUser] = useState(false)
  const [deletingUser, setDeletingUser] = useState(null)
  const [togglingUser, setTogglingUser] = useState(null)
  const [editingUser, setEditingUser] = useState(null)

  const [roleForm, setRoleForm] = useState({ name: '', description: '', permissions: EMPTY_PERMS() })
  const [roleMsg, setRoleMsg] = useState({ text: '', ok: true })
  const [savingRole, setSavingRole] = useState(false)
  const [deletingRole, setDeletingRole] = useState(null)
  const [editingRole, setEditingRole] = useState(null)

  const flash = (setter, text, ok = true) => {
    setter({ text, ok })
    setTimeout(() => setter({ text: '', ok: true }), 4000)
  }

  const fetchUsers = async () => {
    setLoadingUsers(true)
    const res = await fetch('/api/admin/users')
    if (res.status === 403) { setForbidden(true); setLoadingUsers(false); return }
    const json = await res.json()
    setUsers(json.users || [])
    setLoadingUsers(false)
  }

  const fetchRoles = async () => {
    setLoadingRoles(true)
    const json = await fetch('/api/admin/roles').then(r => r.json())
    const list = json.roles || []
    setRoles(list)
    setUserForm(p => ({ ...p, role: p.role || list[0]?.name || '' }))
    setLoadingRoles(false)
  }

  useEffect(() => { fetchUsers(); fetchRoles() }, [])

  const createUser = async (e) => {
    e.preventDefault()
    setSavingUser(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm),
    })
    const json = await res.json()
    setSavingUser(false)
    if (!res.ok) { flash(setUserMsg, json.error, false); return }
    logAudit('create', 'users', json.user.id, { email: json.user.email, role: userForm.role })
    flash(setUserMsg, `User ${json.user.email} created`)
    setUserForm(p => ({ ...p, email: '', full_name: '', password: '' }))
    fetchUsers()
  }

  const toggleActive = async (user) => {
    setTogglingUser(user.id)
    const res = await fetch('/api/admin/users', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: user.id, is_active: !user.is_active }),
    })
    const json = await res.json()
    setTogglingUser(null)
    if (res.ok) {
      logAudit('update', 'users', user.id, { email: user.email, is_active: !user.is_active })
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: json.user.is_active } : u))
    }
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return
    const user = users.find(u => u.id === id)
    setDeletingUser(id)
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    logAudit('delete', 'users', id, { email: user?.email })
    setDeletingUser(null)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const onUserSaved = (updated) => {
    logAudit('update', 'users', updated.id, { email: updated.email, role: updated.role })
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))
    setEditingUser(null)
    flash(setUserMsg, 'User updated')
  }

  const createRole = async (e) => {
    e.preventDefault()
    setSavingRole(true)
    const res = await fetch('/api/admin/roles', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(roleForm),
    })
    const json = await res.json()
    setSavingRole(false)
    if (!res.ok) { flash(setRoleMsg, json.error, false); return }
    flash(setRoleMsg, `Role "${json.role.name}" created`)
    setRoleForm({ name: '', description: '', permissions: EMPTY_PERMS() })
    fetchRoles()
  }

  const deleteRole = async (id) => {
    if (!confirm('Delete this role?')) return
    setDeletingRole(id)
    await fetch(`/api/admin/roles?id=${id}`, { method: 'DELETE' })
    setDeletingRole(null)
    setRoles(prev => prev.filter(r => r.id !== id))
  }

  const onRoleSaved = (updated) => {
    setRoles(prev => prev.map(r => r.id === updated.id ? updated : r))
    setEditingRole(null)
    flash(setRoleMsg, 'Role updated')
  }

  const TABS = [
    { id: 'users', label: 'Users',  Icon: Users },
    { id: 'roles', label: 'Roles',  Icon: Key },
  ]

  return (
    <div className="max-w-5xl pt-4 sm:pt-6">
      {editingUser && <EditUserModal user={editingUser} roles={roles} onClose={() => setEditingUser(null)} onSaved={onUserSaved} />}
      {editingRole && <EditRoleModal role={editingRole} onClose={() => setEditingRole(null)} onSaved={onRoleSaved} />}

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shadow-lg shadow-violet-950/40 shrink-0">
          <ShieldCheck size={20} strokeWidth={1.8} className="text-white" />
        </span>
        <div className="min-w-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">User & Role Management</h1>
          <p className="text-sm text-gray-400 mt-0.5 hidden sm:block">Manage admin users and their permissions</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(({ id, label, Icon }) => (
          <button key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
              tab === id
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}>
            <Icon size={14} />
            {label}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ──────────────────────────────────────── */}
      {tab === 'users' && forbidden && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center text-center gap-3">
          <ShieldAlert size={32} className="text-red-400" />
          <p className="text-red-700 font-semibold">Admin access required</p>
          <p className="text-sm text-red-500">Only users with the <strong>admin</strong> role can manage users and roles.</p>
        </div>
      )}

      {tab === 'users' && !forbidden && (
        <div className="space-y-5">

          {/* Create User */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shadow shadow-violet-950/30">
                <UserPlus size={14} strokeWidth={1.8} className="text-white" />
              </span>
              <h2 className="font-semibold text-gray-800 text-sm">Create New User</h2>
            </div>
            <form onSubmit={createUser} className="p-5 space-y-4" autoComplete="off">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input type="text" value={userForm.full_name}
                    onChange={e => setUserForm(p => ({ ...p, full_name: e.target.value }))}
                    placeholder="Full Name" autoComplete="off"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Email</label>
                  <input type="email" required value={userForm.email}
                    onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com" autoComplete="off"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Password</label>
                  <input type="password" required value={userForm.password}
                    onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min 6 characters" autoComplete="new-password"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Role</label>
                  <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                    className={inputCls}>
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name} — {r.description}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingUser}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow shadow-violet-950/20 transition-all">
                  {savingUser ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {savingUser ? 'Creating…' : 'Create User'}
                </button>
                {userMsg.text && (
                  <span className={`text-sm font-medium ${userMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    {userMsg.text}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* All Users */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
              <Users size={14} className="text-violet-600" />
              <h2 className="font-semibold text-gray-800 text-sm">All Users</h2>
              {users.length > 0 && (
                <span className="ml-auto bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {users.length}
                </span>
              )}
            </div>
            {loadingUsers ? (
              <div className="flex items-center justify-center p-10">
                <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : users.length === 0 ? (
              <div className="py-14 text-center text-gray-400 text-sm">No users found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                      <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Role</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Created</th>
                      <th className="hidden lg:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Last Sign In</th>
                      <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map(u => (
                      <tr key={u.id} className={`hover:bg-gray-50/60 transition-colors ${!u.is_active ? 'opacity-60' : ''}`}>
                        {/* Name — email shown below on mobile */}
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                              {u.full_name ? u.full_name.trim().split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase() : <UserRound size={13} />}
                            </span>
                            <div className="min-w-0">
                              <p className="font-medium text-gray-900 truncate">{u.full_name || <span className="text-gray-400 italic">—</span>}</p>
                              <p className="md:hidden text-xs text-gray-400 truncate mt-0.5">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        {/* Email — hidden on mobile */}
                        <td className="hidden md:table-cell px-4 py-3 text-gray-600 text-sm">
                          <div className="flex items-center gap-1.5">
                            <AtSign size={11} className="text-gray-400 shrink-0" />
                            <span className="truncate">{u.email}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-violet-100 text-violet-700 capitalize whitespace-nowrap">
                            {u.role}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => toggleActive(u)}
                              disabled={togglingUser === u.id}
                              title={u.is_active ? 'Click to deactivate' : 'Click to activate'}
                              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 shrink-0 ${
                                u.is_active ? 'bg-emerald-500' : 'bg-gray-300'
                              }`}
                            >
                              <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                                u.is_active ? 'translate-x-6' : 'translate-x-1'
                              }`} />
                            </button>
                            <span className={`text-xs font-medium hidden sm:inline ${u.is_active ? 'text-emerald-600' : 'text-gray-400'}`}>
                              {togglingUser === u.id ? '…' : u.is_active ? 'Active' : 'Off'}
                            </span>
                          </div>
                        </td>
                        {/* Created — hidden below lg */}
                        <td className="hidden lg:table-cell px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>
                        {/* Last Sign In — hidden below lg */}
                        <td className="hidden lg:table-cell px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}
                        </td>
                        {/* Actions — icon-only on mobile */}
                        <td className="pl-2 pr-4 sm:px-4 py-3 whitespace-nowrap">
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => setEditingUser(u)}
                              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
                            >
                              <Pencil size={11} />
                              <span className="hidden sm:inline">Edit</span>
                            </button>
                            <button
                              onClick={() => deleteUser(u.id)}
                              disabled={deletingUser === u.id}
                              className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors disabled:opacity-40"
                            >
                              <Trash2 size={11} />
                              <span className="hidden sm:inline">{deletingUser === u.id ? '…' : 'Delete'}</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── ROLES TAB ──────────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="space-y-5">

          {/* Create Role */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-violet-600 to-violet-900 flex items-center justify-center shadow shadow-violet-950/30">
                <Plus size={14} strokeWidth={2} className="text-white" />
              </span>
              <h2 className="font-semibold text-gray-800 text-sm">Create New Role</h2>
            </div>
            <form onSubmit={createRole} className="p-5 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Role Name</label>
                  <input type="text" required value={roleForm.name}
                    onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. moderator"
                    className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5">Description</label>
                  <input type="text" value={roleForm.description}
                    onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="What can this role do?"
                    className={inputCls} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Permissions</label>
                <PermMatrix perms={roleForm.permissions} onChange={p => setRoleForm(prev => ({ ...prev, permissions: p }))} />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingRole}
                  className="flex items-center gap-2 px-5 py-2 bg-gradient-to-br from-violet-600 to-violet-800 hover:from-violet-700 hover:to-violet-900 disabled:opacity-50 text-white text-sm font-semibold rounded-xl shadow shadow-violet-950/20 transition-all">
                  {savingRole ? <Loader2 size={13} className="animate-spin" /> : <Plus size={13} />}
                  {savingRole ? 'Creating…' : 'Create Role'}
                </button>
                {roleMsg.text && (
                  <span className={`text-sm font-medium ${roleMsg.ok ? 'text-emerald-600' : 'text-red-600'}`}>
                    {roleMsg.text}
                  </span>
                )}
              </div>
            </form>
          </div>

          {/* All Roles */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
              <Key size={14} className="text-violet-600" />
              <h2 className="font-semibold text-gray-800 text-sm">All Roles</h2>
              {roles.length > 0 && (
                <span className="ml-auto bg-violet-100 text-violet-700 text-xs font-bold px-2 py-0.5 rounded-full">
                  {roles.length}
                </span>
              )}
            </div>
            {loadingRoles ? (
              <div className="flex items-center justify-center p-10">
                <div className="w-7 h-7 border-4 border-violet-600 border-t-transparent rounded-full animate-spin" />
              </div>
            ) : roles.length === 0 ? (
              <div className="py-14 text-center text-gray-400 text-sm">No roles found. Run the SQL migration first.</div>
            ) : (
              <RolesList roles={roles} deletingRole={deletingRole} onEdit={setEditingRole} onDelete={deleteRole} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
