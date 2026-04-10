'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'
import { useAdminPerms, can } from '../AdminContext'

export default function Dashboard() {
  const { perms } = useAdminPerms()
  const [stats, setStats] = useState({ slides: 0, messages: 0, galleries: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [{ count: slidesCount }, { count: messagesCount }] = await Promise.all([
          supabase.from('slides').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
        ])
        setStats({ slides: slidesCount || 0, messages: messagesCount || 0, galleries: 4 })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const statCards = [
    { section: 'slides',   label: 'Total Slides',  value: stats.slides,   color: 'blue',   icon: '🎠', href: '/admin/slides',   link: 'Manage Slides →' },
    { section: 'messages', label: 'Messages',       value: stats.messages, color: 'green',  icon: '💬', href: '/admin/messages', link: 'View Messages →' },
    { section: 'gallery',  label: 'Galleries',      value: stats.galleries,color: 'purple', icon: '🖼️', href: '/admin/gallery',  link: 'Manage Gallery →' },
  ].filter(c => can(perms, c.section))

  const quickActions = [
    { section: 'slides',   action: 'edit', label: 'Add Slide',     icon: '➕', href: '/admin/slides/new',  hover: 'blue' },
    { section: 'messages', action: 'view', label: 'View Messages', icon: '📧', href: '/admin/messages',    hover: 'green' },
    { section: 'about',    action: 'edit', label: 'Edit About',    icon: '✏️', href: '/admin/about',       hover: 'purple' },
    { section: 'visitors', action: 'view', label: 'Visitors',      icon: '🎟️', href: '/admin/visitors',   hover: 'yellow' },
  ].filter(a => can(perms, a.section, a.action))

  const colorMap = {
    blue:   { text: 'text-blue-600',   bg: 'bg-blue-100' },
    green:  { text: 'text-green-600',  bg: 'bg-green-100' },
    purple: { text: 'text-purple-600', bg: 'bg-purple-100' },
  }

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map(card => {
            const c = colorMap[card.color]
            return (
              <div key={card.section} className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-500 text-sm">{card.label}</p>
                    <p className={`text-3xl font-bold ${c.text}`}>{card.value}</p>
                  </div>
                  <div className={`w-16 h-16 ${c.bg} rounded-full flex items-center justify-center`}>
                    <span className="text-2xl">{card.icon}</span>
                  </div>
                </div>
                <a href={card.href} className="text-blue-600 text-sm hover:underline mt-4 block">{card.link}</a>
              </div>
            )
          })}
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <a key={action.label} href={action.href}
                className={`p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-${action.hover}-500 hover:bg-${action.hover}-50 transition-colors`}>
                <span className="text-2xl mb-2 block">{action.icon}</span>
                <span className="text-sm">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {statCards.length === 0 && quickActions.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center text-gray-400">
          <p className="text-4xl mb-3">🔒</p>
          <p className="text-lg font-medium">Limited Access</p>
          <p className="text-sm mt-1">Your role does not have access to any sections. Contact an admin.</p>
        </div>
      )}
    </div>
  )
}
