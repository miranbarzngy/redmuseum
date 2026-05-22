'use client'

import { useEffect, useState } from 'react'
import {
  Bell,
  CheckCircle,
  Ticket,
  Monitor,
  Mail,
  Frame,
  Plus,
  Pencil,
  LayoutDashboard,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import { useAdminPerms, can } from '../AdminContext'

function IconBadge({ Icon, grad, shadow, size = 20 }) {
  return (
    <span className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${grad} flex items-center justify-center shrink-0 shadow-lg ${shadow}`}>
      <Icon size={size} strokeWidth={1.8} className="text-white" />
    </span>
  )
}

export default function Dashboard() {
  const { perms } = useAdminPerms()
  const [stats, setStats] = useState({
    slides: 0,
    messages: 0,
    galleries: 4,
    pendingReservations: 0,
    approvedToday: 0,
  })
  const [loading, setLoading] = useState(true)

  const today = new Date().toISOString().split('T')[0]

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [
          { count: slidesCount },
          { count: messagesCount },
          { count: pendingCount },
          { count: approvedTodayCount },
        ] = await Promise.all([
          supabase.from('slides').select('*', { count: 'exact', head: true }),
          supabase.from('messages').select('*', { count: 'exact', head: true }),
          supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('reservations').select('*', { count: 'exact', head: true }).eq('status', 'approved').eq('date', today),
        ])
        setStats({
          slides: slidesCount || 0,
          messages: messagesCount || 0,
          galleries: 4,
          pendingReservations: pendingCount || 0,
          approvedToday: approvedTodayCount || 0,
        })
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [today])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  const statCards = [
    {
      section: 'slides',
      label: 'Total Slides',
      value: stats.slides,
      Icon: Monitor,
      grad: 'from-blue-700 to-blue-900',
      shadow: 'shadow-blue-950/50',
      textColor: 'text-blue-700',
      href: '/admin/slides',
      link: 'Manage Slides →',
    },
    {
      section: 'messages',
      label: 'Messages',
      value: stats.messages,
      Icon: Mail,
      grad: 'from-teal-600 to-teal-900',
      shadow: 'shadow-teal-950/50',
      textColor: 'text-teal-700',
      href: '/admin/messages',
      link: 'View Messages →',
    },
    {
      section: 'gallery',
      label: 'Galleries',
      value: stats.galleries,
      Icon: Frame,
      grad: 'from-rose-700 to-rose-900',
      shadow: 'shadow-rose-950/50',
      textColor: 'text-rose-700',
      href: '/admin/gallery',
      link: 'Manage Gallery →',
    },
  ].filter(c => can(perms, c.section))

  const quickActions = [
    {
      section: 'slides',
      action: 'edit',
      label: 'Add Slide',
      Icon: Plus,
      grad: 'from-blue-700 to-blue-900',
      shadow: 'shadow-blue-950/40',
      href: '/admin/slides/new',
    },
    {
      section: 'messages',
      action: 'view',
      label: 'View Messages',
      Icon: Mail,
      grad: 'from-teal-600 to-teal-900',
      shadow: 'shadow-teal-950/40',
      href: '/admin/messages',
    },
    {
      section: 'about',
      action: 'edit',
      label: 'Edit About',
      Icon: Pencil,
      grad: 'from-amber-600 to-amber-800',
      shadow: 'shadow-amber-950/40',
      href: '/admin/about',
    },
    {
      section: 'visitors',
      action: 'view',
      label: 'Visitors',
      Icon: Ticket,
      grad: 'from-indigo-600 to-indigo-900',
      shadow: 'shadow-indigo-950/40',
      href: '/admin/visitors',
    },
  ].filter(a => can(perms, a.section, a.action))

  const showReservationCards = can(perms, 'visitors')

  return (
    <div>
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      {/* Visitor Reservation Cards */}
      {showReservationCards && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Pending */}
          <a href="/admin/visitors" className="block bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Pending Reservations</p>
                <p className={`text-4xl font-bold mt-1 ${stats.pendingReservations > 0 ? 'text-amber-500' : 'text-gray-400'}`}>
                  {stats.pendingReservations}
                </p>
                <p className="text-xs text-gray-400 mt-1">Awaiting approval</p>
              </div>
              {stats.pendingReservations > 0 ? (
                <IconBadge Icon={Bell} grad="from-amber-500 to-amber-700" shadow="shadow-amber-950/50" />
              ) : (
                <IconBadge Icon={CheckCircle} grad="from-emerald-600 to-emerald-800" shadow="shadow-emerald-950/50" />
              )}
            </div>
            <span className="text-amber-600 text-sm hover:underline mt-4 block font-medium">
              {stats.pendingReservations > 0 ? `Review ${stats.pendingReservations} pending →` : 'All caught up →'}
            </span>
          </a>

          {/* Approved Today */}
          <a href="/admin/visitors" className="block bg-white rounded-2xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm font-medium">Approved Visitors Today</p>
                <p className={`text-4xl font-bold mt-1 ${stats.approvedToday > 0 ? 'text-indigo-600' : 'text-gray-400'}`}>
                  {stats.approvedToday}
                </p>
                <p className="text-xs text-gray-400 mt-1">{today}</p>
              </div>
              <IconBadge Icon={Ticket} grad="from-indigo-600 to-indigo-900" shadow="shadow-indigo-950/50" />
            </div>
            <span className="text-indigo-600 text-sm hover:underline mt-4 block font-medium">View today's visitors →</span>
          </a>
        </div>
      )}

      {/* Stats Cards */}
      {statCards.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {statCards.map(card => (
            <div key={card.section} className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-sm">{card.label}</p>
                  <p className={`text-3xl font-bold mt-1 ${card.textColor}`}>{card.value}</p>
                </div>
                <IconBadge Icon={card.Icon} grad={card.grad} shadow={card.shadow} />
              </div>
              <a href={card.href} className="text-blue-600 text-sm hover:underline mt-4 block font-medium">{card.link}</a>
            </div>
          ))}
        </div>
      )}

      {/* Quick Actions */}
      {quickActions.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-gray-100">
          <h2 className="text-xl font-semibold mb-5">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {quickActions.map(action => (
              <a
                key={action.label}
                href={action.href}
                className="flex flex-col items-center gap-3 p-5 rounded-2xl border border-gray-100 hover:border-gray-200 hover:shadow-sm bg-gray-50 hover:bg-white transition-all"
              >
                <span className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.grad} flex items-center justify-center shadow-lg ${action.shadow}`}>
                  <action.Icon size={20} strokeWidth={2} className="text-white" />
                </span>
                <span className="text-sm font-medium text-gray-700">{action.label}</span>
              </a>
            ))}
          </div>
        </div>
      )}

      {statCards.length === 0 && quickActions.length === 0 && !showReservationCards && (
        <div className="bg-white rounded-2xl shadow-sm p-12 text-center text-gray-400 border border-gray-100">
          <IconBadge Icon={LayoutDashboard} grad="from-slate-500 to-slate-700" shadow="shadow-slate-950/40" size={24} />
          <p className="text-lg font-medium mt-4">Limited Access</p>
          <p className="text-sm mt-1">Your role does not have access to any sections. Contact an admin.</p>
        </div>
      )}
    </div>
  )
}
