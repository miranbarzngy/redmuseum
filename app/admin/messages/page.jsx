'use client'

import { useEffect, useState } from 'react'
import {
  Mail,
  Inbox,
  Trash2,
  Reply,
  Phone,
  AtSign,
  Clock,
  MessageSquare,
  User,
} from 'lucide-react'
import { supabase } from '../../lib/supabase-client'
import VisibilityToggle from '../components/VisibilityToggle'

function getInitials(name = '') {
  return name.trim().split(' ').slice(0, 2).map(w => w[0]?.toUpperCase()).join('') || '?'
}

function AvatarCircle({ name, active }) {
  const colors = [
    'from-teal-600 to-teal-800',
    'from-blue-600 to-blue-800',
    'from-indigo-600 to-indigo-800',
    'from-rose-600 to-rose-800',
    'from-amber-600 to-amber-800',
    'from-emerald-600 to-emerald-800',
    'from-violet-600 to-violet-800',
  ]
  const idx = name.charCodeAt(0) % colors.length
  return (
    <span className={`w-10 h-10 rounded-full bg-gradient-to-br ${colors[idx]} flex items-center justify-center text-white text-sm font-bold shrink-0 shadow`}>
      {getInitials(name)}
    </span>
  )
}

function formatDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diff = now - date
  const mins = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateFull(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export default function MessagesManagement() {
  const [messages, setMessages] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedMessage, setSelectedMessage] = useState(null)

  useEffect(() => { fetchMessages() }, [])

  useEffect(() => {
    if (!supabase) return
    const channel = supabase
      .channel('messages-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, () => fetchMessages())
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase.from('messages').select('*').order('created_at', { ascending: false })
      if (error) throw error
      setMessages(data || [])
    } catch (error) {
      console.error('Error fetching messages:', error)
    } finally {
      setLoading(false)
    }
  }

  const deleteMessage = async (id) => {
    if (!confirm('Are you sure you want to delete this message?')) return
    try {
      const { error } = await supabase.from('messages').delete().eq('id', id)
      if (error) throw error
      fetchMessages()
      setSelectedMessage(null)
    } catch (error) {
      alert('Error deleting message: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-12 h-12 border-4 border-teal-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-900 flex items-center justify-center shadow-lg shadow-teal-950/40">
          <Mail size={20} strokeWidth={1.8} className="text-white" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
          <p className="text-sm text-gray-400 mt-0.5">
            {messages.length === 0 ? 'No messages' : `${messages.length} message${messages.length !== 1 ? 's' : ''} received`}
          </p>
        </div>
      </div>

      {/* Visibility toggle */}
      <div className="mb-6">
        <VisibilityToggle settingKey="show_messages" label="Contact / Messages Section" />
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

        {/* Inbox list — 2/5 width */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3.5 border-b border-gray-100">
            <Inbox size={15} className="text-teal-600" />
            <h2 className="font-semibold text-gray-800 text-sm">Inbox</h2>
            {messages.length > 0 && (
              <span className="ml-auto bg-teal-100 text-teal-700 text-xs font-bold px-2 py-0.5 rounded-full">
                {messages.length}
              </span>
            )}
          </div>

          <div className="max-h-[600px] overflow-y-auto divide-y divide-gray-50">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                <MessageSquare size={32} className="mb-3 opacity-30" />
                <p className="text-sm">No messages yet</p>
              </div>
            ) : (
              messages.map(msg => (
                <button
                  key={msg.id}
                  onClick={() => setSelectedMessage(msg)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-teal-50/40 transition-colors ${
                    selectedMessage?.id === msg.id ? 'bg-teal-50 border-l-2 border-teal-500' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <AvatarCircle name={msg.name} active={selectedMessage?.id === msg.id} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-semibold text-sm text-gray-800 truncate">{msg.name}</p>
                        <span className="text-xs text-gray-400 shrink-0">{formatDate(msg.created_at)}</span>
                      </div>
                      <p className="text-xs text-gray-500 truncate mt-0.5">{msg.email}</p>
                      <p className="text-xs text-gray-400 truncate mt-1 leading-snug">{msg.message}</p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Message detail — 3/5 width */}
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {selectedMessage ? (
            <div className="flex flex-col h-full">
              {/* Detail header */}
              <div className="px-6 py-5 border-b border-gray-100">
                <div className="flex items-start gap-4">
                  <AvatarCircle name={selectedMessage.name} />
                  <div className="flex-1 min-w-0">
                    <h2 className="text-lg font-bold text-gray-900 leading-tight">{selectedMessage.name}</h2>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5">
                      {selectedMessage.email && (
                        <a href={`mailto:${selectedMessage.email}`} className="flex items-center gap-1.5 text-sm text-teal-700 hover:underline">
                          <AtSign size={12} />
                          {selectedMessage.email}
                        </a>
                      )}
                      {selectedMessage.phone && (
                        <a href={`tel:${selectedMessage.phone}`} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700">
                          <Phone size={12} />
                          {selectedMessage.phone}
                        </a>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 shrink-0">
                    <Clock size={11} />
                    {formatDate(selectedMessage.created_at)}
                  </div>
                </div>
              </div>

              {/* Message body */}
              <div className="flex-1 px-6 py-5">
                <div className="flex items-center gap-2 mb-3">
                  <MessageSquare size={14} className="text-gray-400" />
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Message</h3>
                </div>
                <div className="bg-gray-50 rounded-xl px-4 py-4 text-sm text-gray-700 whitespace-pre-wrap leading-relaxed border border-gray-100">
                  {selectedMessage.message}
                </div>
                <p className="text-xs text-gray-400 mt-3 flex items-center gap-1">
                  <Clock size={11} />
                  {formatDateFull(selectedMessage.created_at)}
                </p>
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  onClick={() => deleteMessage(selectedMessage.id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-xl transition-colors"
                >
                  <Trash2 size={14} />
                  Delete
                </button>
                <a
                  href={`mailto:${selectedMessage.email}?subject=Re: Amna Suraka Museum Contact`}
                  className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gradient-to-br from-teal-600 to-teal-800 hover:from-teal-700 hover:to-teal-900 text-white rounded-xl shadow-md shadow-teal-950/30 transition-all"
                >
                  <Reply size={14} />
                  Reply via Email
                </a>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full py-24 text-gray-400">
              <span className="w-14 h-14 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-900 flex items-center justify-center shadow-lg shadow-teal-950/40 mb-4">
                <Mail size={24} strokeWidth={1.6} className="text-white" />
              </span>
              <p className="text-sm font-medium text-gray-500">Select a message to read</p>
              <p className="text-xs text-gray-400 mt-1">Click any message from the inbox</p>
            </div>
          )}
        </div>

      </div>
    </div>
  )
}
