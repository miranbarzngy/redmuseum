'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase-client'
import { AdminContext } from './AdminContext'

// Map each route segment → permission section
const ROUTE_SECTION = {
  dashboard: 'dashboard',
  slides: 'slides',
  messages: 'messages',
  about: 'about',
  gallery: 'gallery',
  archive: 'archive',
  exclusive: 'exclusive',
  visitors: 'visitors',
  users: 'users',
  'section-order': 'section_order',
}

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null)
  const [userPerms, setUserPerms] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  const FULL_PERMS = Object.fromEntries(
    ['dashboard','slides','gallery','archive','exclusive','visitors','messages','about','users','section_order']
      .map(s => [s, { view: true, edit: true, delete: true }])
  )

  const fetchPerms = async (userObj) => {
    try {
      const role = userObj?.user_metadata?.role || 'viewer'
      // superadmin always gets full access regardless of DB state
      if (role === 'admin') { setUserPerms(FULL_PERMS); return }
      const res = await fetch('/api/admin/roles')
      if (!res.ok) { setUserPerms(FULL_PERMS); return }
      const json = await res.json()
      const matched = (json.roles || []).find(r => r.name === role)
      if (!matched) {
        // role exists in metadata but not in DB — treat admin as full access
        if (role === 'admin') { setUserPerms(FULL_PERMS); return }
        setUserPerms({})
        return
      }
      setUserPerms(matched.permissions || {})
    } catch { setUserPerms(FULL_PERMS) }
  }

  const can = (section) => {
    if (!userPerms) return false // hide all until permissions are loaded
    return !!userPerms[section]?.view
  }

  useEffect(() => {
    if (!supabase) { setLoading(false); return }

    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) {
          if (pathname !== '/admin/login') router.push('/admin/login')
        } else {
          setUser(session.user)
          fetchPerms(session.user)
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!session) {
          router.push('/admin/login')
        } else {
          setUser(session.user)
          // Re-check ban status on every token refresh
          if (event === 'TOKEN_REFRESHED' || event === 'SIGNED_IN') {
            fetchPerms(session.user)
          }
        }
      })
      const pollId = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (!session) { router.push('/admin/login'); return }
        const res = await fetch(`/api/admin/users`)
        const json = await res.json()
        const me = (json.users || []).find(u => u.id === session.user.id)
        if (me && !me.is_active) {
          await supabase.auth.signOut()
          router.push('/admin/login')
        }
      } catch {}
    }, 30000)

      return () => { subscription.unsubscribe(); clearInterval(pollId) }
    } catch (error) {
      console.error('Auth listener error:', error)
    }
  }, [pathname, router])

  // Redirect if user navigates to a section they can't view
  useEffect(() => {
    if (!userPerms || pathname === '/admin/login') return
    const segment = pathname.split('/')[2]
    const section = ROUTE_SECTION[segment]
    if (section && !userPerms[section]?.view) {
      // Find first accessible section — never push to login (that signs them out)
      const first = Object.entries(ROUTE_SECTION).find(([, s]) => userPerms[s]?.view)
      if (first) router.push(`/admin/${first[0]}`)
      // If truly no sections accessible, stay put and show empty state
    }
  }, [userPerms, pathname, router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  if (pathname === '/admin/login') return children

  const navLinks = [
    { section: 'dashboard',  href: '/admin/dashboard',  icon: '📊', label: 'Dashboard',   exact: true },
    { section: 'slides',     href: '/admin/slides',     icon: '🎠', label: 'Slides',      exact: false },
    { section: 'messages',   href: '/admin/messages',   icon: '💬', label: 'Messages',    exact: true },
    { section: 'about',      href: '/admin/about',      icon: 'ℹ️', label: 'About',       exact: true },
    { section: 'gallery',    href: '/admin/gallery',    icon: '🖼️', label: 'Gallery',     exact: true },
    { section: 'archive',    href: '/admin/archive',    icon: '📁', label: 'Archive',     exact: true },
    { section: 'exclusive',  href: '/admin/exclusive',  icon: '⭐', label: 'Exclusive',   exact: true },
    { section: 'visitors',      href: '/admin/visitors',      icon: '🎟️', label: 'Visitors',       exact: true },
    { section: 'section_order', href: '/admin/section-order', icon: '↕️',  label: 'Section Order',  exact: true },
    { section: 'users',         href: '/admin/users',         icon: '👤', label: 'Users & Roles',  exact: true },
  ]

  const isActive = (link) => link.exact ? pathname === link.href : pathname.startsWith(link.href)

  return (
    <AdminContext.Provider value={{ perms: userPerms }}>
      <div className="min-h-screen bg-gray-100">

        {/* ── Mobile top bar ── */}
        <div className="lg:hidden fixed top-0 left-0 right-0 z-40 h-16 bg-gray-900 text-white flex items-center justify-between px-4 shadow-lg">
          <button
            onClick={() => setSidebarOpen(o => !o)}
            className="p-2 rounded-lg hover:bg-gray-700 transition-colors"
            aria-label="Toggle menu"
          >
            <div className="w-5 h-0.5 bg-white mb-1 transition-all" style={{ transform: sidebarOpen ? 'rotate(45deg) translate(4px,4px)' : 'none' }} />
            <div className="w-5 h-0.5 bg-white mb-1 transition-all" style={{ opacity: sidebarOpen ? 0 : 1 }} />
            <div className="w-5 h-0.5 bg-white transition-all" style={{ transform: sidebarOpen ? 'rotate(-45deg) translate(4px,-4px)' : 'none' }} />
          </button>
          <div className="text-center">
            <p className="text-sm font-bold leading-tight">Admin Panel</p>
            <p className="text-xs text-gray-400">Amna Suraka Museum</p>
          </div>
          <button onClick={handleLogout} className="text-xs bg-red-600 hover:bg-red-700 px-3 py-1.5 rounded-lg transition-colors font-semibold">
            Logout
          </button>
        </div>

        {/* ── Backdrop (mobile) ── */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-30 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* ── Sidebar ── */}
        <aside className={`
          fixed left-0 top-0 h-full w-64 bg-gray-900 text-white z-40
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0
        `}>
          <div className="p-6 hidden lg:block">
            <h1 className="text-xl font-bold">Admin Panel</h1>
            <p className="text-sm text-gray-400">Amna Suraka Museum</p>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
          >
            ✕
          </button>

          <nav className="mt-6 lg:mt-6 pt-16 lg:pt-0 overflow-y-auto h-[calc(100%-120px)]">
            {!userPerms && (
              <div className="px-6 py-4 flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            )}
            {navLinks.map(link => can(link.section) && (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                className={`flex items-center gap-3 px-6 py-3 hover:bg-gray-800 transition-colors text-sm ${
                  isActive(link) ? 'bg-gray-800 border-l-4 border-blue-500 pl-5' : ''
                }`}
              >
                <span>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4">
            <button onClick={handleLogout} className="w-full bg-red-600 hover:bg-red-700 py-2 rounded-lg transition-colors text-sm font-semibold">
              Logout
            </button>
          </div>
        </aside>

        {/* ── Main content ── */}
        <main className="lg:ml-64 min-h-screen">
          <div className="pt-16 lg:pt-0 px-4 md:px-6 lg:px-8 pb-8">
            {children}
          </div>
        </main>

      </div>
    </AdminContext.Provider>
  )
}
