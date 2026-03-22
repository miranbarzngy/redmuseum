'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'

export default function Dashboard() {
  const [stats, setStats] = useState({
    slides: 0,
    messages: 0,
    galleries: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Get slides count
        const { count: slidesCount } = await supabase
          .from('slides')
          .select('*', { count: 'exact', head: true })

        // Get messages count
        const { count: messagesCount } = await supabase
          .from('messages')
          .select('*', { count: 'exact', head: true })

        setStats({
          slides: slidesCount || 0,
          messages: messagesCount || 0,
          galleries: 4 // Fixed galleries
        })
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

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Total Slides</p>
              <p className="text-3xl font-bold text-blue-600">{stats.slides}</p>
            </div>
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🎠</span>
            </div>
          </div>
          <a href="/admin/slides" className="text-blue-600 text-sm hover:underline mt-4 block">
            Manage Slides →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Messages</p>
              <p className="text-3xl font-bold text-green-600">{stats.messages}</p>
            </div>
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">💬</span>
            </div>
          </div>
          <a href="/admin/messages" className="text-blue-600 text-sm hover:underline mt-4 block">
            View Messages →
          </a>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">Galleries</p>
              <p className="text-3xl font-bold text-purple-600">{stats.galleries}</p>
            </div>
            <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center">
              <span className="text-2xl">🖼️</span>
            </div>
          </div>
          <a href="/admin/gallery" className="text-blue-600 text-sm hover:underline mt-4 block">
            Manage Gallery →
          </a>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <a href="/admin/slides/new" className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-blue-500 hover:bg-blue-50 transition-colors">
            <span className="text-2xl mb-2 block">➕</span>
            <span className="text-sm">Add Slide</span>
          </a>
          <a href="/admin/messages" className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-green-500 hover:bg-green-50 transition-colors">
            <span className="text-2xl mb-2 block">📧</span>
            <span className="text-sm">View Messages</span>
          </a>
          <a href="/admin/about" className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-purple-500 hover:bg-purple-50 transition-colors">
            <span className="text-2xl mb-2 block">✏️</span>
            <span className="text-sm">Edit About</span>
          </a>
          <a href="/" target="_blank" className="p-4 border-2 border-dashed border-gray-300 rounded-lg text-center hover:border-gray-500 hover:bg-gray-50 transition-colors">
            <span className="text-2xl mb-2 block">🌐</span>
            <span className="text-sm">View Site</span>
          </a>
        </div>
      </div>
    </div>
  )
}
