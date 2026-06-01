'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import {
  LayoutDashboard,
  Monitor,
  Mail,
  Landmark,
  Frame,
  ScrollText,
  Crown,
  Ticket,
  Layers,
  ShieldCheck,
  Globe,
  LayoutGrid,
  Settings,
  ClipboardList,
  LogOut,
} from 'lucide-react'
import { supabase } from '../lib/supabase-client'
import { AdminContext } from './AdminContext'
import { useMuseumName } from '../lib/useMuseumName'

const BASE_NAV = [
  { section: 'dashboard',     href: '/admin/dashboard',      Icon: LayoutDashboard, label: 'Dashboard',      exact: true,  grad: 'from-slate-600 to-slate-800',     shadow: 'shadow-slate-950/60'   },
  { section: 'slides',        href: '/admin/slides',         Icon: Monitor,         label: 'Slides',         exact: false, grad: 'from-blue-700 to-blue-900',       shadow: 'shadow-blue-950/60'    },
  { section: 'messages',      href: '/admin/messages',       Icon: Mail,            label: 'Messages',       exact: true,  grad: 'from-teal-600 to-teal-900',       shadow: 'shadow-teal-950/60'    },
  { section: 'about',         href: '/admin/about',          Icon: Landmark,        label: 'About',          exact: true,  grad: 'from-amber-600 to-amber-800',     shadow: 'shadow-amber-950/60'   },
  { section: 'gallery',       href: '/admin/gallery',        Icon: Frame,           label: 'Gallery',        exact: true,  grad: 'from-rose-700 to-rose-900',       shadow: 'shadow-rose-950/60'    },
  { section: 'archive',       href: '/admin/archive',        Icon: ScrollText,      label: 'Archive',        exact: true,  grad: 'from-stone-600 to-stone-800',     shadow: 'shadow-stone-950/60'   },
  { section: 'exclusive',        href: '/admin/museumactivities', Icon: Crown,        label: 'Museum Activities', exact: true, grad: 'from-yellow-600 to-amber-700',   shadow: 'shadow-yellow-950/60'  },
  { section: 'visitors',      href: '/admin/visitors',       Icon: Ticket,          label: 'Visitors',       exact: true,  grad: 'from-indigo-600 to-indigo-900',   shadow: 'shadow-indigo-950/60'  },
  { section: 'section_order', href: '/admin/section-order',  Icon: Layers,          label: 'Section Order',  exact: true,  grad: 'from-emerald-700 to-emerald-900', shadow: 'shadow-emerald-950/60' },
  { section: 'showcase_cards',href: '/admin/showcase-cards', Icon: LayoutGrid,      label: 'Social Media Post', exact: true,  grad: 'from-fuchsia-600 to-fuchsia-900', shadow: 'shadow-fuchsia-950/60' },
  { section: 'languages',     href: '/admin/languages',      Icon: Globe,           label: 'Languages',      exact: true,  grad: 'from-sky-600 to-sky-900',         shadow: 'shadow-sky-950/60'     },
  { section: 'users',         href: '/admin/users',          Icon: ShieldCheck,     label: 'Users & Roles',  exact: true,  grad: 'from-violet-700 to-violet-900',   shadow: 'shadow-violet-950/60'  },
  { section: 'settings',      href: '/admin/settings',       Icon: Settings,        label: 'Museum Settings',exact: true,  grad: 'from-indigo-600 to-indigo-900',   shadow: 'shadow-indigo-950/60'  },
  { section: 'audit',         href: '/admin/audit',          Icon: ClipboardList,   label: 'Audit Log',      exact: true,  grad: 'from-slate-600 to-slate-800',     shadow: 'shadow-slate-950/60'   },
]

// Map each route segment → permission section
const ROUTE_SECTION = {
  dashboard: 'dashboard',
  slides: 'slides',
  messages: 'messages',
  about: 'about',
  gallery: 'gallery',
  archive: 'archive',
  exclusive: 'exclusive',
  museumactivities: 'exclusive',
  visitors: 'visitors',
  users: 'users',
  'section-order': 'section_order',
  languages: 'languages',
  'showcase-cards': 'showcase_cards',
  settings: 'settings',
  audit: 'audit',
}

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null)
  const [userPerms, setUserPerms] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [navOrder, setNavOrder] = useState(null)
  const dragIdx = useRef(null)
  const overIdx = useRef(null)
  const router = useRouter()
  const pathname = usePathname()
  const museumName = useMuseumName()

  const FULL_PERMS = Object.fromEntries(
    ['dashboard','slides','gallery','archive','exclusive','visitors','messages','about','users','section_order','languages','showcase_cards','settings','audit']
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
          if (pathname !== '/login') router.push('/login')
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
          router.push('/login')
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
        if (!session) { router.push('/login'); return }
        const res = await fetch(`/api/admin/users`)
        const json = await res.json()
        const me = (json.users || []).find(u => u.id === session.user.id)
        if (me && !me.is_active) {
          await supabase.auth.signOut()
          router.push('/login')
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
    if (!userPerms || pathname === '/login') return
    const segment = pathname.split('/')[2]
    const section = ROUTE_SECTION[segment]
    if (section && !userPerms[section]?.view) {
      // Find first accessible section — never push to login (that signs them out)
      const first = Object.entries(ROUTE_SECTION).find(([, s]) => userPerms[s]?.view)
      if (first) router.push(`/admin/${first[0]}`)
      // If truly no sections accessible, stay put and show empty state
    }
  }, [userPerms, pathname, router])

  // Load saved nav order from localStorage — must be before any early returns
  useEffect(() => {
    try {
      const saved = localStorage.getItem('admin-nav-order')
      if (saved) {
        const order = JSON.parse(saved)
        const sorted = [...BASE_NAV].sort((a, b) => order.indexOf(a.section) - order.indexOf(b.section))
        setNavOrder(sorted)
      } else {
        setNavOrder(BASE_NAV)
      }
    } catch { setNavOrder(BASE_NAV) }
  }, [])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    await fetch('/api/admin/auth', { method: 'DELETE' })
    router.push('/login')
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

  if (pathname === '/login') return children

  const navLinks = navOrder || BASE_NAV

  const handleDragStart = (i) => { dragIdx.current = i }
  const handleDragOver  = (e, i) => { e.preventDefault(); overIdx.current = i }
  const handleDrop      = () => {
    const from = dragIdx.current
    const to   = overIdx.current
    if (from === null || to === null || from === to) return
    const updated = [...navLinks]
    const [moved] = updated.splice(from, 1)
    updated.splice(to, 0, moved)
    setNavOrder(updated)
    localStorage.setItem('admin-nav-order', JSON.stringify(updated.map(l => l.section)))
    dragIdx.current = null
    overIdx.current = null
  }
  const handleDragEnd = () => { dragIdx.current = null; overIdx.current = null }

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
            <p className="text-xs text-gray-400">{museumName.en}</p>
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
            <p className="text-sm text-gray-400">{museumName.en || 'Museum'}</p>
          </div>

          {/* Close button — mobile only */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden absolute top-3 right-3 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-gray-700"
          >
            ✕
          </button>

          <nav className="mt-6 lg:mt-6 pt-16 lg:pt-0 overflow-y-auto h-[calc(100%-160px)]">
            {!userPerms && (
              <div className="px-6 py-4 flex items-center gap-2 text-gray-500 text-sm">
                <div className="w-4 h-4 border-2 border-gray-500 border-t-transparent rounded-full animate-spin" />
                Loading…
              </div>
            )}
            {navLinks.map((link, i) => can(link.section) && (
              <div
                key={link.href}
                draggable
                onDragStart={() => handleDragStart(i)}
                onDragOver={e => handleDragOver(e, i)}
                onDrop={handleDrop}
                onDragEnd={handleDragEnd}
                className="group/drag relative mx-3 mb-0.5"
                style={{ cursor: 'grab' }}
              >
                {/* Drop indicator */}
                <div className="absolute -top-0.5 left-0 right-0 h-0.5 rounded-full bg-blue-400 opacity-0 group-hover/drag:opacity-0 transition-opacity pointer-events-none" />

                <Link
                  href={link.href}
                  onClick={() => setSidebarOpen(false)}
                  className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all duration-150 text-sm font-medium ${
                    isActive(link)
                      ? 'bg-white/10 text-white'
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                  draggable={false}
                >
                  <span className={`w-9 h-9 rounded-xl bg-gradient-to-br ${link.grad} flex items-center justify-center shrink-0 shadow-lg ${link.shadow}`}>
                    <link.Icon size={17} strokeWidth={2} className="text-white" />
                  </span>
                  <span>{link.label}</span>
                  {isActive(link) && (
                    <span className="ml-auto w-1.5 h-1.5 rounded-full bg-white/60" />
                  )}
                  <i className="ri-draggable text-gray-600 group-hover/drag:text-gray-400 ml-auto text-base transition-colors" />
                </Link>
              </div>
            ))}
          </nav>

          <div className="absolute bottom-0 left-0 right-0 p-4 space-y-2.5">
            {/* User info card */}
            {user && (
              <div className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 flex items-center gap-3">
                <span className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-violet-700 flex items-center justify-center text-white text-xs font-bold shrink-0 shadow shadow-violet-950/40">
                  {user.user_metadata?.full_name
                    ? user.user_metadata.full_name.trim().split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
                    : user.email?.[0]?.toUpperCase() || '?'}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate leading-tight">
                    {user.user_metadata?.full_name || user.email?.split('@')[0]}
                  </p>
                  <span className="inline-block mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-violet-500/20 text-violet-300 capitalize leading-none">
                    {user.user_metadata?.role || 'viewer'}
                  </span>
                </div>
              </div>
            )}
            {/* Logout */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white py-2.5 rounded-xl transition-all duration-150 text-sm font-medium border border-red-600/30 hover:border-red-600"
            >
              <LogOut size={16} strokeWidth={2} />
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
