'use client'

import { useEffect, useState } from 'react'
import { supabase } from '../../lib/supabase-client'

export default function VisitorsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    totalVisits: 0,
    uniqueVisitors: 0,
    mostVisitedPage: 'N/A'
  })
  const [recentLogs, setRecentLogs] = useState([])
  const [dailyStats, setDailyStats] = useState([])

  useEffect(() => {
    fetchVisitorData()
  }, [])

  const fetchVisitorData = async () => {
    if (!supabase) {
      console.error('Supabase not configured')
      setLoading(false)
      return
    }

    try {
      // Fetch all visitor logs
      const { data: allLogs, error: allError } = await supabase
        .from('visitor_logs')
        .select('*')
        .order('visited_at', { ascending: false })

      if (allError) throw allError

      // Calculate total visits
      const totalVisits = allLogs?.length || 0

      // Calculate unique visitors (by user_agent for now since IP is null)
      const uniqueVisitors = new Set(allLogs?.map(log => log.user_agent)).size || 0

      // Find most visited page
      const pageCounts = {}
      allLogs?.forEach(log => {
        const page = log.page_url.split('?')[0] // Remove query params
        pageCounts[page] = (pageCounts[page] || 0) + 1
      })
      const mostVisitedPage = Object.entries(pageCounts)
        .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

      setStats({
        totalVisits,
        uniqueVisitors,
        mostVisitedPage
      })

      // Get recent 20 logs
      setRecentLogs(allLogs?.slice(0, 20) || [])

      // Calculate daily stats for last 7 days
      const now = new Date()
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      
      const dailyCounts = {}
      for (let i = 0; i < 7; i++) {
        const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
        const dateStr = date.toISOString().split('T')[0]
        dailyCounts[dateStr] = 0
      }

      allLogs?.forEach(log => {
        const dateStr = new Date(log.visited_at).toISOString().split('T')[0]
        if (dailyCounts[dateStr] !== undefined) {
          dailyCounts[dateStr]++
        }
      })

      const dailyStatsArray = Object.entries(dailyCounts)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date))

      setDailyStats(dailyStatsArray)

    } catch (error) {
      console.error('Error fetching visitor data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Visitor Tracking</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Total Visits</h3>
          <p className="text-3xl font-bold text-blue-600">{stats.totalVisits.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Unique Visitors</h3>
          <p className="text-3xl font-bold text-green-600">{stats.uniqueVisitors.toLocaleString()}</p>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-gray-500 text-sm font-medium mb-2">Most Visited Page</h3>
          <p className="text-xl font-bold text-purple-600 truncate">{stats.mostVisitedPage}</p>
        </div>
      </div>

      {/* Chart - Visits Last 7 Days */}
      <div className="bg-white rounded-lg shadow p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Visits - Last 7 Days</h2>
        <div className="h-64 flex items-end justify-between gap-2">
          {dailyStats.map((day) => {
            const maxCount = Math.max(...dailyStats.map(d => d.count), 1)
            const height = (day.count / maxCount) * 100
            return (
              <div key={day.date} className="flex-1 flex flex-col items-center">
                <div 
                  className="w-full bg-blue-500 rounded-t transition-all hover:bg-blue-600"
                  style={{ height: `${Math.max(height, 5)}%` }}
                  title={`${day.count} visits`}
                ></div>
                <p className="text-xs text-gray-500 mt-2">
                  {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' })}
                </p>
                <p className="text-xs font-medium">{day.count}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Recent Visits Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b">
          <h2 className="text-lg font-semibold">Recent Visits</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Page URL</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Device Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {recentLogs.length > 0 ? (
                recentLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900 truncate max-w-xs" title={log.page_url}>
                      {log.page_url}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        log.device_type === 'Mobile' ? 'bg-green-100 text-green-800' :
                        log.device_type === 'Tablet' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {log.device_type || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">
                      {formatDate(log.visited_at)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                    No visitor data yet. Visit the website to start tracking!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
