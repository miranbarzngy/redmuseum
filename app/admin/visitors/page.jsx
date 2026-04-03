'use client'

import { useState, useEffect } from 'react'
import { getSupabaseClient } from '../../lib/supabase-client'
import { QRCodeSVG } from 'qrcode.react'

const STATUS_STYLES = {
  pending:  'bg-yellow-100 text-yellow-800',
  approved: 'bg-blue-100 text-blue-800',
  visited:  'bg-green-100 text-green-800',
}

const STATUS_LABELS = {
  pending:  'Pending',
  approved: 'Approved',
  visited:  'Visited',
}

export default function VisitorsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [qrModal, setQrModal] = useState(null)
  const [showTab, setShowTab] = useState(true)
  const [tabToggling, setTabToggling] = useState(false)
  const [availableDays, setAvailableDays] = useState(['1','2','3','4','5'])
  const [availableHours, setAvailableHours] = useState({ start: '09:00', end: '17:00' })
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleMsg, setScheduleMsg] = useState('')

  const DAYS = [
    { val: '0', label: 'Sunday' },
    { val: '1', label: 'Monday' },
    { val: '2', label: 'Tuesday' },
    { val: '3', label: 'Wednesday' },
    { val: '4', label: 'Thursday' },
    { val: '5', label: 'Friday' },
    { val: '6', label: 'Saturday' },
  ]

  useEffect(() => {
    fetchReservations()
    fetchTabSetting()
    fetchSchedule()
    const supabase = getSupabaseClient()
    if (!supabase) return
    const channel = supabase
      .channel('visitors-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reservations' }, fetchReservations)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' },
        ({ new: row }) => { if (row?.key === 'show_visitor_tab') setShowTab(row.value === 'true') })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const fetchSchedule = async () => {
    const [daysRes, hoursRes] = await Promise.all([
      fetch('/api/settings?key=available_days').then(r => r.json()),
      fetch('/api/settings?key=available_hours').then(r => r.json()),
    ])
    if (daysRes.value) try { setAvailableDays(JSON.parse(daysRes.value)) } catch {}
    if (hoursRes.value) try { setAvailableHours(JSON.parse(hoursRes.value)) } catch {}
  }

  const saveSchedule = async () => {
    setSavingSchedule(true)
    const [r1, r2] = await Promise.all([
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'available_days', value: JSON.stringify(availableDays) }) }),
      fetch('/api/settings', { method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: 'available_hours', value: JSON.stringify(availableHours) }) }),
    ])
    setSavingSchedule(false)
    setScheduleMsg(r1.ok && r2.ok ? 'Saved!' : 'Error saving')
    setTimeout(() => setScheduleMsg(''), 3000)
  }

  const toggleDay = (val) => {
    setAvailableDays(prev =>
      prev.includes(val) ? prev.filter(d => d !== val) : [...prev, val]
    )
  }

  const fetchTabSetting = async () => {
    const res = await fetch('/api/settings?key=show_visitor_tab')
    const json = await res.json()
    if (json.value !== null) setShowTab(json.value === 'true')
  }

  const toggleTab = async () => {
    setTabToggling(true)
    const newVal = !showTab
    const res = await fetch('/api/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'show_visitor_tab', value: String(newVal) }),
    })
    const json = await res.json()
    if (!res.ok) {
      alert('Failed to save: ' + (json.error || 'Unknown error'))
    } else {
      setShowTab(newVal)
    }
    setTabToggling(false)
  }

  const fetchReservations = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) { setLoading(false); return }
    const { data } = await supabase
      .from('reservations')
      .select('*')
      .order('created_at', { ascending: false })
    setReservations(data || [])
    setLoading(false)
  }

  const updateStatus = async (id, status) => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.from('reservations').update({ status }).eq('id', id)
    fetchReservations()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this reservation?')) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    await supabase.from('reservations').delete().eq('id', id)
    fetchReservations()
  }

  const filtered = reservations.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.phone.includes(search)
  )

  const counts = {
    total: reservations.length,
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    visited: reservations.filter(r => r.status === 'visited').length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Visitor Reservations</h1>
      </div>

      {/* Sidebar Tab Visibility Toggle */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 flex items-center justify-between">
        <div>
          <p className="font-semibold text-gray-800">Sidebar Tab Visibility</p>
          <p className="text-sm text-gray-500 mt-0.5">
            {showTab ? 'Visitor Booking tab is visible on the public site' : 'Visitor Booking tab is hidden from the public site'}
          </p>
        </div>
        <button
          onClick={toggleTab}
          disabled={tabToggling}
          className={`relative inline-flex h-7 w-14 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${showTab ? 'bg-green-500' : 'bg-gray-300'}`}
        >
          <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${showTab ? 'translate-x-8' : 'translate-x-1'}`} />
        </button>
      </div>

      {/* Availability Schedule */}
      <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
        <div>
          <p className="font-semibold text-gray-800">Visitor Availability Schedule</p>
          <p className="text-sm text-gray-500 mt-0.5">Set which days and hours visitors can book</p>
        </div>

        {/* Days */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Available Days</p>
          <div className="flex flex-wrap gap-2">
            {DAYS.map(day => (
              <button
                key={day.val}
                onClick={() => toggleDay(day.val)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  availableDays.includes(day.val)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {day.label}
              </button>
            ))}
          </div>
        </div>

        {/* Hours */}
        <div className="flex items-center gap-4 flex-wrap">
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Open From</p>
            <input
              type="time"
              value={availableHours.start}
              onChange={e => setAvailableHours(p => ({ ...p, start: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Open Until</p>
            <input
              type="time"
              value={availableHours.end}
              onChange={e => setAvailableHours(p => ({ ...p, end: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            onClick={saveSchedule}
            disabled={savingSchedule}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            {savingSchedule ? 'Saving…' : 'Save Schedule'}
          </button>
          {scheduleMsg && (
            <span className={`text-sm font-medium ${scheduleMsg === 'Saved!' ? 'text-green-600' : 'text-red-600'}`}>
              {scheduleMsg}
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total', value: counts.total, color: 'bg-gray-50 border-gray-200' },
          { label: 'Pending', value: counts.pending, color: 'bg-yellow-50 border-yellow-200' },
          { label: 'Approved', value: counts.approved, color: 'bg-blue-50 border-blue-200' },
          { label: 'Visited', value: counts.visited, color: 'bg-green-50 border-green-200' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-sm text-gray-500 font-medium">{s.label}</p>
            <p className="text-3xl font-black text-gray-800 mt-1">{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-9 pr-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
        />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {['Name', 'Guests', 'Phone', 'Date', 'Time', 'Note', 'Status', 'Created', 'Actions'].map(h => (
                <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="px-4 py-12 text-center text-gray-400">
                  {search ? 'No results found.' : 'No reservations yet.'}
                </td>
              </tr>
            )}
            {filtered.map(r => (
              <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap">{r.name}</td>
                <td className="px-4 py-3 text-gray-600 text-center">{r.guest_count}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap" dir="ltr">{r.phone}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.date}</td>
                <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{r.time?.slice(0, 5)}</td>
                <td className="px-4 py-3 text-gray-400 max-w-[150px] truncate">{r.note || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[r.status]}`}>
                    {STATUS_LABELS[r.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                  {new Date(r.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 whitespace-nowrap">
                  <div className="flex items-center gap-1.5">
                    {/* QR */}
                    <button
                      onClick={() => setQrModal(r)}
                      className="px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <i className="ri-qr-code-line" /> QR
                    </button>
                    {/* Approve */}
                    {r.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(r.id, 'approved')}
                        className="px-2.5 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-md text-xs font-medium transition-colors"
                      >
                        Approve
                      </button>
                    )}
                    {/* Mark Visited */}
                    {r.status === 'approved' && (
                      <button
                        onClick={() => updateStatus(r.id, 'visited')}
                        className="px-2.5 py-1.5 bg-green-50 hover:bg-green-100 text-green-700 rounded-md text-xs font-medium transition-colors whitespace-nowrap"
                      >
                        ✓ Visited
                      </button>
                    )}
                    {/* Delete */}
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-md text-xs font-medium transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-2xl p-8 max-w-sm w-full shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900">Visitor QR Code</h2>
              <button onClick={() => setQrModal(null)} className="text-gray-400 hover:text-gray-600 text-xl">
                <i className="ri-close-line" />
              </button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm">
                <QRCodeSVG
                  value={`RESERVATION:${qrModal.id}`}
                  size={220}
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                  level="H"
                />
              </div>
            </div>

            <div className="space-y-2 text-sm border-t pt-4">
              {[
                ['Name', qrModal.name],
                ['Guests', qrModal.guest_count],
                ['Phone', qrModal.phone],
                ['Date', qrModal.date],
                ['Time', qrModal.time?.slice(0, 5)],
                ['Status', STATUS_LABELS[qrModal.status]],
                ['ID', qrModal.id.slice(0, 8).toUpperCase()],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-gray-900">{val}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              {qrModal.status === 'pending' && (
                <button
                  onClick={() => { updateStatus(qrModal.id, 'approved'); setQrModal(p => ({ ...p, status: 'approved' })) }}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  Approve
                </button>
              )}
              {qrModal.status === 'approved' && (
                <button
                  onClick={() => { updateStatus(qrModal.id, 'visited'); setQrModal(p => ({ ...p, status: 'visited' })) }}
                  className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-semibold transition-colors"
                >
                  ✓ Mark as Visited
                </button>
              )}
              <button onClick={() => setQrModal(null)} className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-semibold hover:bg-gray-50 transition-colors">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
