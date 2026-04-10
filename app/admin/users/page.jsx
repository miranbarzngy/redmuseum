'use client'

import { useState, useEffect } from 'react'

const SECTIONS = ['dashboard','slides','gallery','archive','exclusive','visitors','messages','about','activities','section_order','users']
const ACTIONS = ['view','edit','delete']

const EMPTY_PERMS = () =>
  Object.fromEntries(SECTIONS.map(s => [s, { view: false, edit: false, delete: false }]))

// ── Permission Matrix ─────────────────────────────────────
function PermMatrix({ perms, onChange, disabled }) {
  const p = { ...EMPTY_PERMS(), ...perms }
  const set = (section, action, val) => {
    const next = { ...p, [section]: { ...p[section], [action]: val } }
    // if edit/delete enabled, view must be on
    if ((action === 'edit' || action === 'delete') && val) next[section].view = true
    // if view disabled, disable edit+delete
    if (action === 'view' && !val) { next[section].edit = false; next[section].delete = false }
    onChange(next)
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-3 py-2 text-left font-semibold text-gray-500 uppercase tracking-wider w-28">Section</th>
            {ACTIONS.map(a => (
              <th key={a} className="px-3 py-2 text-center font-semibold text-gray-500 uppercase tracking-wider capitalize">{a}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {SECTIONS.map(s => (
            <tr key={s} className="hover:bg-gray-50">
              <td className="px-3 py-2 font-medium text-gray-700 capitalize">{s}</td>
              {ACTIONS.map(a => (
                <td key={a} className="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    checked={!!p[s]?.[a]}
                    disabled={disabled}
                    onChange={e => set(s, a, e.target.checked)}
                    className="w-4 h-4 accent-blue-600 cursor-pointer disabled:opacity-40"
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ── Roles List with expand/collapse ──────────────────────
function RolesList({ roles, deletingRole, onEdit, onDelete }) {
  const [expanded, setExpanded] = useState({})
  const toggle = (id) => setExpanded(p => ({ ...p, [id]: !p[id] }))

  return (
    <div className="divide-y divide-gray-100">
      {roles.map(role => (
        <div key={role.id}>
          {/* Header row — always visible */}
          <div className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer"
            onClick={() => toggle(role.id)}>
            <div className="flex items-center gap-3 min-w-0">
              <span className={`text-gray-400 text-xs transition-transform duration-200 ${expanded[role.id] ? 'rotate-90' : ''}`}>▶</span>
              <span className="font-semibold text-gray-800 capitalize">{role.name}</span>
              {role.description && <span className="text-xs text-gray-400 truncate">{role.description}</span>}
              {/* Permission summary badges */}
              {!expanded[role.id] && (
                <div className="flex gap-1 ml-2 flex-wrap">
                  {['view','edit','delete'].map(action => {
                    const count = Object.values(role.permissions || {}).filter(p => p[action]).length
                    if (!count) return null
                    return (
                      <span key={action} className={`px-1.5 py-0.5 rounded text-[10px] font-semibold ${
                        action === 'view' ? 'bg-green-100 text-green-700'
                        : action === 'edit' ? 'bg-blue-100 text-blue-700'
                        : 'bg-red-100 text-red-700'
                      }`}>
                        {action} ×{count}
                      </span>
                    )
                  })}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3 shrink-0" onClick={e => e.stopPropagation()}>
              <button onClick={() => onEdit(role)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Edit</button>
              <button onClick={() => onDelete(role.id)} disabled={deletingRole === role.id}
                className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-40">
                {deletingRole === role.id ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>

          {/* Expanded permissions matrix */}
          {expanded[role.id] && (
            <div className="px-6 pb-5 bg-gray-50 border-t border-gray-100">
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Edit Role</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Name</label>
              <input
                value={form.name} required
                onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
              <input
                value={form.description}
                onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Permissions</label>
            <PermMatrix perms={form.permissions} onChange={p => setForm(prev => ({ ...prev, permissions: p }))} />
          </div>
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg">
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
  const [form, setForm] = useState({ email: user.email, password: '', role: user.role })
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  const selectedRole = roles.find(r => r.name === form.role)

  const save = async (e) => {
    e.preventDefault(); setSaving(true); setErr('')
    const body = { id: user.id, email: form.email, role: form.role }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-100">
          <h3 className="font-bold text-gray-800">Edit User</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={save} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
            <input type="email" required value={form.email}
              onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
              New Password <span className="text-gray-400 normal-case font-normal">(leave blank to keep current)</span>
            </label>
            <input type="password" value={form.password}
              onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</label>
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              {roles.map(r => <option key={r.id} value={r.name}>{r.name} — {r.description}</option>)}
            </select>
          </div>
          {selectedRole && (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Role Permissions (read-only)</label>
              <PermMatrix perms={selectedRole.permissions} onChange={() => {}} disabled />
            </div>
          )}
          {err && <p className="text-red-500 text-sm">{err}</p>}
          <div className="flex gap-3 pt-1">
            <button type="submit" disabled={saving}
              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-lg">
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

  const [userForm, setUserForm] = useState({ email: '', password: '', role: '' })
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
    const json = await fetch('/api/admin/users').then(r => r.json())
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

  // ── User actions ──────────────────────────────────────────
  const createUser = async (e) => {
    e.preventDefault()
    setSavingUser(true)
    const res = await fetch('/api/admin/users', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(userForm),
    })
    const json = await res.json()
    setSavingUser(false)
    if (!res.ok) { flash(setUserMsg, json.error, false); return }
    flash(setUserMsg, `User ${json.user.email} created`)
    setUserForm(p => ({ ...p, email: '', password: '' }))
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
    if (res.ok) setUsers(prev => prev.map(u => u.id === user.id ? { ...u, is_active: json.user.is_active } : u))
  }

  const deleteUser = async (id) => {
    if (!confirm('Delete this user permanently?')) return
    setDeletingUser(id)
    await fetch(`/api/admin/users?id=${id}`, { method: 'DELETE' })
    setDeletingUser(null)
    setUsers(prev => prev.filter(u => u.id !== id))
  }

  const onUserSaved = (updated) => {
    setUsers(prev => prev.map(u => u.id === updated.id ? { ...u, ...updated } : u))
    setEditingUser(null)
    flash(setUserMsg, 'User updated')
  }

  // ── Role actions ──────────────────────────────────────────
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

  return (
    <div>
      {editingUser && <EditUserModal user={editingUser} roles={roles} onClose={() => setEditingUser(null)} onSaved={onUserSaved} />}
      {editingRole && <EditRoleModal role={editingRole} onClose={() => setEditingRole(null)} onSaved={onRoleSaved} />}

      <h1 className="text-2xl font-bold text-gray-800 mb-6">User & Role Management</h1>

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-lg w-fit">
        {['users','roles'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-6 py-2 rounded-md text-sm font-semibold transition-colors ${
              tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {t === 'users' ? '👤 Users' : '🔑 Roles'}
          </button>
        ))}
      </div>

      {/* ── USERS TAB ──────────────────────────────────────── */}
      {tab === 'users' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Create New User</h2>
            <form onSubmit={createUser} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Email</label>
                  <input type="email" required value={userForm.email}
                    onChange={e => setUserForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="user@example.com"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Password</label>
                  <input type="password" required value={userForm.password}
                    onChange={e => setUserForm(p => ({ ...p, password: e.target.value }))}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role</label>
                  <select value={userForm.role} onChange={e => setUserForm(p => ({ ...p, role: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name} — {r.description}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingUser}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg">
                  {savingUser ? 'Creating…' : 'Create User'}
                </button>
                {userMsg.text && <span className={`text-sm font-medium ${userMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{userMsg.text}</span>}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">All Users</h2>
              <span className="text-xs text-gray-400">{users.length} total</span>
            </div>
            {loadingUsers ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : users.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No users found</div>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-6 py-3 text-left">Email</th>
                    <th className="px-6 py-3 text-left">Role</th>
                    <th className="px-6 py-3 text-left">Status</th>
                    <th className="px-6 py-3 text-left">Created</th>
                    <th className="px-6 py-3 text-left">Last Sign In</th>
                    <th className="px-6 py-3 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.map(u => (
                    <tr key={u.id} className={`hover:bg-gray-50 ${!u.is_active ? 'opacity-60' : ''}`}>
                      <td className="px-6 py-3 font-medium text-gray-800">{u.email}</td>
                      <td className="px-6 py-3">
                        <span className="px-2 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-700 capitalize">{u.role}</span>
                      </td>
                      <td className="px-6 py-3">
                        <button onClick={() => toggleActive(u)} disabled={togglingUser === u.id}
                          title={u.is_active ? 'Click to deactivate' : 'Click to activate'}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-40 ${u.is_active ? 'bg-green-500' : 'bg-gray-300'}`}>
                          <span className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${u.is_active ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                        <span className={`ml-2 text-xs font-medium ${u.is_active ? 'text-green-600' : 'text-gray-400'}`}>
                          {togglingUser === u.id ? '…' : u.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-gray-500">{u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}</td>
                      <td className="px-6 py-3 text-gray-500">{u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString() : 'Never'}</td>
                      <td className="px-6 py-3">
                        <div className="flex items-center gap-3">
                          <button onClick={() => setEditingUser(u)} className="text-blue-500 hover:text-blue-700 text-xs font-semibold">Edit</button>
                          <button onClick={() => deleteUser(u.id)} disabled={deletingUser === u.id}
                            className="text-red-500 hover:text-red-700 text-xs font-semibold disabled:opacity-40">
                            {deletingUser === u.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      )}

      {/* ── ROLES TAB ──────────────────────────────────────── */}
      {tab === 'roles' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-gray-200 p-6">
            <h2 className="text-base font-semibold text-gray-800 mb-4">Create New Role</h2>
            <form onSubmit={createRole} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Role Name</label>
                  <input type="text" required value={roleForm.name}
                    onChange={e => setRoleForm(p => ({ ...p, name: e.target.value }))}
                    placeholder="e.g. moderator"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Description</label>
                  <input type="text" value={roleForm.description}
                    onChange={e => setRoleForm(p => ({ ...p, description: e.target.value }))}
                    placeholder="What can this role do?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Permissions</label>
                <PermMatrix perms={roleForm.permissions} onChange={p => setRoleForm(prev => ({ ...prev, permissions: p }))} />
              </div>
              <div className="flex items-center gap-3">
                <button type="submit" disabled={savingRole}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg">
                  {savingRole ? 'Creating…' : 'Create Role'}
                </button>
                {roleMsg.text && <span className={`text-sm font-medium ${roleMsg.ok ? 'text-green-600' : 'text-red-600'}`}>{roleMsg.text}</span>}
              </div>
            </form>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">All Roles</h2>
              <span className="text-xs text-gray-400">{roles.length} roles</span>
            </div>
            {loadingRoles ? (
              <div className="p-8 text-center text-gray-400 text-sm">Loading…</div>
            ) : roles.length === 0 ? (
              <div className="p-8 text-center text-gray-400 text-sm">No roles found. Run the SQL migration first.</div>
            ) : (
              <RolesList roles={roles} editingRole={editingRole} deletingRole={deletingRole}
                onEdit={setEditingRole} onDelete={deleteRole} />
            )}
          </div>
        </div>
      )}
    </div>
  )
}
