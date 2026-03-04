'use client'

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '../lib/supabase-client'

export default function AdminLayout({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // Check if supabase is configured
    if (!supabase) {
      setLoading(false)
      return
    }

    // Check current user
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) {
          // Not logged in, redirect to login
          if (pathname !== '/admin/login') {
            router.push('/admin/login')
          }
        } else {
          setUser(session.user)
        }
      } catch (error) {
        console.error('Auth check error:', error)
      } finally {
        setLoading(false)
      }
    }

    checkUser()

    // Listen for auth changes
    try {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (!session) {
          router.push('/admin/login')
        } else {
          setUser(session.user)
        }
      })

      return () => subscription.unsubscribe()
    } catch (error) {
      console.error('Auth listener error:', error)
    }
  }, [pathname, router])

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

  // Don't show sidebar on login page
  if (pathname === '/admin/login') {
    return children
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 bg-gray-900 text-white">
        <div className="p-6">
          <h1 className="text-xl font-bold">Admin Panel</h1>
          <p className="text-sm text-gray-400">Amna Suraka Museum</p>
        </div>
        
        <nav className="mt-6">
          <Link href="/admin/dashboard" className={`block px-6 py-3 hover:bg-gray-800 ${pathname === '/admin/dashboard' ? 'bg-gray-800 border-l-4 border-blue-500' : ''}`}>
            📊 Dashboard
          </Link>
          <Link href="/admin/slides" className={`block px-6 py-3 hover:bg-gray-800 ${pathname === '/admin/slides' ? 'bg-gray-800 border-l-4 border-blue-500' : ''}`}>
            🎠 Slides
          </Link>
          <Link href="/admin/messages" className={`block px-6 py-3 hover:bg-gray-800 ${pathname === '/admin/messages' ? 'bg-gray-800 border-l-4 border-blue-500' : ''}`}>
            💬 Messages
          </Link>
          <Link href="/admin/about" className={`block px-6 py-3 hover:bg-gray-800 ${pathname === '/admin/about' ? 'bg-gray-800 border-l-4 border-blue-500' : ''}`}>
            ℹ️ About
          </Link>
          <Link href="/admin/gallery" className={`block px-6 py-3 hover:bg-gray-800 ${pathname === '/admin/gallery' ? 'bg-gray-800 border-l-4 border-blue-500' : ''}`}>
            🖼️ Gallery
          </Link>
          <Link href="/admin/archive" className={`block px-6 py-3 hover:bg-gray-800 ${pathname === '/admin/archive' ? 'bg-gray-800 border-l-4 border-blue-500' : ''}`}>
            📁 Archive
          </Link>
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-6">
          <button
            onClick={handleLogout}
            className="w-full bg-red-600 hover:bg-red-700 py-2 rounded transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  )
}
