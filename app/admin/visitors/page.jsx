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
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')

  const today = new Date().toISOString().split('T')[0]
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
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
    try {
      const supabase = getSupabaseClient()
      if (!supabase) { setLoading(false); return }
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) console.error('Reservations fetch error:', error)
      setReservations(data || [])
    } catch (e) {
      console.error('fetchReservations threw:', e)
    } finally {
      setLoading(false)
    }
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

  const filtered = reservations.filter(r => {
    if (search && !(r.name || '').toLowerCase().includes(search.toLowerCase()) && !(r.phone || '').includes(search)) return false
    if (filterFrom && r.date < filterFrom) return false
    if (filterTo && r.date > filterTo) return false
    if (filterStatus && r.status !== filterStatus) return false
    return true
  })

  const hasFilters = search || filterFrom || filterTo || filterStatus
  const clearFilters = () => { setSearch(''); setFilterFrom(''); setFilterTo(''); setFilterStatus('') }

  const printGuest = (r) => {
    const origin = window.location.origin
    const logoUrl = `${origin}/assets/images/logonav.png`
    const statusColor = { pending: '#92400e', approved: '#1d4ed8', visited: '#166534' }
    const statusBg   = { pending: '#fef3c7', approved: '#dbeafe', visited: '#dcfce7' }
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Visitor Pass — ${r.name}</title>
<script src="https://cdn.jsdelivr.net/npm/qrcode/build/qrcode.min.js"><\/script>
<style>
  @page { size: A4 portrait; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    font-family: 'Segoe UI', Arial, sans-serif;
    width: 210mm; height: 297mm;
    display: flex; flex-direction: column;
    background: #fff; color: #111;
    -webkit-print-color-adjust: exact; print-color-adjust: exact;
  }

  /* ── Top bar — solid museum red ── */
  .top-bar { height: 10px; background: #c0001a; }

  /* ── Header ── */
  .header {
    padding: 20px 36px 18px;
    background: #111;
    display: flex; align-items: center; justify-content: space-between;
  }
  .logo-wrap img { height: 54px; width: auto; object-fit: contain; display: block; }
  .doc-label { text-align: right; }
  .doc-label .tag {
    display: inline-block;
    background: #c0001a;
    color: #fff; font-size: 9pt; font-weight: 800;
    padding: 5px 18px; border-radius: 4px; letter-spacing: 1.5px;
    text-transform: uppercase;
  }
  .doc-label .id { font-size: 7.5pt; color: #888; margin-top: 6px; font-family: monospace; }

  /* ── Red divider line ── */
  .red-line { height: 3px; background: #c0001a; }

  /* ── Body ── */
  .body { flex: 1; padding: 28px 36px 20px; }

  .section-title {
    font-size: 7.5pt; font-weight: 800; text-transform: uppercase;
    letter-spacing: 1.5px; color: #c0001a; margin-bottom: 12px;
    display: flex; align-items: center; gap: 8px;
  }
  .section-title::after { content: ''; flex: 1; height: 1px; background: #e5e7eb; }

  /* Info grid */
  .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px 20px; }
  .info-card {
    background: #fafafa; border: 1px solid #e5e7eb;
    border-left: 3px solid #c0001a;
    border-radius: 6px; padding: 11px 14px;
  }
  .info-card.full { grid-column: 1 / -1; }
  .info-card .lbl {
    font-size: 6.5pt; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.8px; color: #999; margin-bottom: 4px;
  }
  .info-card .val { font-size: 13.5pt; font-weight: 800; color: #111; line-height: 1.2; }
  .info-card .val.mono { font-family: monospace; font-size: 12pt; }
  .info-card .val.italic { font-size: 11pt; font-weight: 400; font-style: italic; color: #444; }

  .status-badge {
    display: inline-block; padding: 4px 16px;
    border-radius: 4px; font-size: 10pt; font-weight: 800; letter-spacing: 0.3px;
  }

  /* ── Dashed divider ── */
  .divider { border: none; border-top: 1px dashed #ddd; margin: 22px 0; }

  /* ── QR section ── */
  .qr-section { display: flex; flex-direction: column; align-items: center; gap: 10px; }
  .qr-outer {
    padding: 16px; background: #fff;
    border: 2px solid #111; border-radius: 10px;
    box-shadow: 4px 4px 0px #c0001a;
  }
  .qr-label { font-size: 8pt; color: #888; letter-spacing: 0.4px; }
  .qr-id { font-size: 8.5pt; font-family: monospace; color: #c0001a; font-weight: 700; letter-spacing: 0.5px; }

  /* ── Footer ── */
  .footer {
    padding: 12px 36px; background: #111;
    display: flex; align-items: center; justify-content: space-between;
  }
  .footer-brand { font-size: 8pt; font-weight: 700; color: #fff; }
  .footer-note  { font-size: 7pt; color: #888; }
  .bottom-bar { height: 6px; background: #c0001a; }

  @media print {
    body { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
<div class="top-bar"></div>

<!-- Header -->
<div class="header">
  <div class="logo-wrap">
    <img src="${logoUrl}" alt="Amna Suraka Museum" />
  </div>
  <div class="doc-label">
    <div class="tag">Visitor Pass</div>
    <div class="id">REF: ${r.id.slice(0, 8).toUpperCase()}</div>
  </div>
</div>
<div class="red-line"></div>

<!-- Body -->
<div class="body">
  <p class="section-title">Reservation Details</p>

  <div class="info-grid">
    <div class="info-card full">
      <div class="lbl">Full Name</div>
      <div class="val">${r.name}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Phone Number</div>
      <div class="val mono" dir="ltr">${r.phone}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Number of Guests</div>
      <div class="val">${r.guest_count} ${Number(r.guest_count) === 1 ? 'Person' : 'People'}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Visit Date</div>
      <div class="val">${r.date}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Visit Time</div>
      <div class="val">${r.time?.slice(0, 5) || '—'}</div>
    </div>
    <div class="info-card">
      <div class="lbl">Status</div>
      <div class="val">
        <span class="status-badge" style="color:${statusColor[r.status]};background:${statusBg[r.status]}">
          ${STATUS_LABELS[r.status]}
        </span>
      </div>
    </div>
    ${r.note ? `
    <div class="info-card full">
      <div class="lbl">Note</div>
      <div class="val italic">${r.note}</div>
    </div>` : ''}
  </div>

  <hr class="divider"/>

  <!-- QR Code -->
  <div class="qr-section">
    <p class="section-title" style="width:100%;justify-content:center;gap:10px">
      <span style="flex:1;height:1px;background:#e5e7eb;display:block"></span>
      Scan to Verify
      <span style="flex:1;height:1px;background:#e5e7eb;display:block"></span>
    </p>
    <div class="qr-outer">
      <canvas id="qr-canvas"></canvas>
    </div>
    <div class="qr-label">Official Reservation QR Code</div>
    <div class="qr-id">RESERVATION · ${r.id.slice(0, 8).toUpperCase()}</div>
  </div>
</div>

<!-- Footer -->
<div class="footer">
  <div class="footer-brand">Amna Suraka National Museum — Sulaymaniyah, Kurdistan</div>
  <div class="footer-note">Present this pass upon arrival · For official use only</div>
</div>
<div class="bottom-bar"></div>

<script>
  QRCode.toCanvas(
    document.getElementById('qr-canvas'),
    'RESERVATION:${r.id}',
    { width: 190, margin: 1, color: { dark: '#111111', light: '#ffffff' } },
    function(err) { if (!err) setTimeout(() => window.print(), 350); }
  );
<\/script>
</body>
</html>`
    const win = window.open('', '_blank', 'width=850,height=750')
    win.document.write(html)
    win.document.close()
  }

  const printGuests = () => {
    const origin = window.location.origin
    const logoUrl = `${origin}/assets/images/logonav.png`
    const now = new Date()
    const printDate = now.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })
    const printTime = now.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })

    const statusColor = { pending: '#92400e', approved: '#1d4ed8', visited: '#166534' }
    const statusBg   = { pending: '#fef3c7', approved: '#dbeafe', visited: '#dcfce7' }

    const rows = filtered.map((r, i) => `
      <tr class="${i % 2 === 0 ? 'row-even' : 'row-odd'}">
        <td class="num">${i + 1}</td>
        <td class="name">${r.name}</td>
        <td class="center">${r.guest_count}</td>
        <td dir="ltr">${r.phone}</td>
        <td class="center">${r.date}</td>
        <td class="center">${r.time?.slice(0, 5) || '—'}</td>
        <td class="note">${r.note || '—'}</td>
        <td class="center">
          <span class="badge" style="color:${statusColor[r.status]};background:${statusBg[r.status]}">
            ${STATUS_LABELS[r.status]}
          </span>
        </td>
      </tr>`).join('')

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Visitor Reservations — Amna Suraka Museum</title>
<style>
  @page { size: A4 landscape; margin: 12mm 14mm 12mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #111; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }

  /* ── Top red bar ── */
  .top-bar { height: 6px; background: #c0001a; margin: -12mm -14mm 0; }

  /* ── Header ── */
  .header { display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0 12px; border-bottom: 2px solid #111; margin-bottom: 12px; }
  .logo-wrap img { height: 46px; width: auto; object-fit: contain; }
  .header-right { text-align: right; font-size: 7.5pt; color: #666; line-height: 1.7; }
  .header-right strong { color: #111; }

  /* ── Title bar ── */
  .title-bar { background: #111; color: #fff; padding: 8px 14px; margin-bottom: 12px;
    display: flex; align-items: center; justify-content: space-between; border-left: 5px solid #c0001a; }
  .title-bar h1 { font-size: 12pt; font-weight: 800; letter-spacing: 0.5px; }
  .title-bar span { font-size: 8pt; color: #aaa; }

  /* ── Summary cards ── */
  .summary { display: grid; grid-template-columns: repeat(5,1fr); gap: 8px; margin-bottom: 12px; }
  .card { border-radius: 6px; padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center; border-top: 3px solid #c0001a; }
  .card .val { font-size: 18pt; font-weight: 900; line-height: 1.1; color: #111; }
  .card .lbl { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; color: #888; }
  .card-guests .val { color: #c0001a; }

  /* ── Table ── */
  table { width: 100%; border-collapse: collapse; font-size: 8pt; }
  thead tr { background: #111; color: #fff; }
  thead th { padding: 7px 8px; text-align: left; font-weight: 700; font-size: 7pt; text-transform: uppercase; letter-spacing: 0.6px; white-space: nowrap; }
  thead th:first-child { border-left: 4px solid #c0001a; }
  th.center, td.center { text-align: center; }
  th.num, td.num { width: 24px; text-align: center; }
  td { padding: 6px 8px; vertical-align: middle; }
  td.name { font-weight: 700; }
  td.note { color: #aaa; font-style: italic; max-width: 90px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .row-even { background: #fff; }
  .row-odd  { background: #fafafa; }
  tr:last-child td { border-bottom: 3px solid #c0001a; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-size: 7pt; font-weight: 700; white-space: nowrap; }

  /* ── Footer ── */
  .footer { margin-top: 12px; border-top: 2px solid #111; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 7pt; color: #888; }
  .footer-brand { font-weight: 700; color: #111; }
  .footer-red { color: #c0001a; font-weight: 700; }
</style>
</head>
<body>
<div class="top-bar"></div>

<!-- Header -->
<div class="header">
  <div class="logo-wrap">
    <img src="${logoUrl}" alt="Amna Suraka Museum" />
  </div>
  <div class="header-right">
    <div><strong>Printed:</strong> ${printDate} at ${printTime}</div>
    <div><strong>Total Records:</strong> ${filtered.length}</div>
  </div>
</div>

<!-- Title bar -->
<div class="title-bar">
  <h1>🎟️ Visitor Reservations Report</h1>
  <span>${search ? `Filtered: "${search}"` : 'All Reservations'}</span>
</div>

<!-- Summary -->
<div class="summary">
  <div class="card">          <div class="val">${counts.total}</div>    <div class="lbl">Total</div></div>
  <div class="card card-guests"><div class="val">${reservations.reduce((s,r)=>s+(Number(r.guest_count)||0),0)}</div><div class="lbl">Guests</div></div>
  <div class="card">          <div class="val">${counts.pending}</div>  <div class="lbl">Pending</div></div>
  <div class="card">          <div class="val">${counts.approved}</div> <div class="lbl">Approved</div></div>
  <div class="card">          <div class="val">${counts.visited}</div>  <div class="lbl">Visited</div></div>
</div>

<!-- Table -->
<table>
  <thead>
    <tr>
      <th class="num">#</th>
      <th>Name</th>
      <th class="center">Guests</th>
      <th>Phone</th>
      <th class="center">Date</th>
      <th class="center">Time</th>
      <th>Note</th>
      <th class="center">Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#aaa">No reservations found.</td></tr>'}
  </tbody>
</table>

<!-- Footer -->
<div class="footer">
  <div class="footer-brand">Amna Suraka National Museum · <span class="footer-red">Red Security</span> · Sulaymaniyah, Kurdistan</div>
  <div>Confidential — for internal use only</div>
</div>

<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`

    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(html)
    win.document.close()
  }

  const counts = {
    total: reservations.length,
    guests: reservations.reduce((s, r) => s + (Number(r.guest_count) || 0), 0),
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
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Visitor Reservations</h1>
      </div>

      <div className="space-y-6">

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
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: 'Total',        value: counts.total,    color: 'bg-gray-50 border-gray-200',     text: 'text-gray-800' },
          { label: 'Total Guests', value: counts.guests,   color: 'bg-purple-50 border-purple-200', text: 'text-purple-700' },
          { label: 'Pending',      value: counts.pending,  color: 'bg-yellow-50 border-yellow-200', text: 'text-yellow-700' },
          { label: 'Approved',     value: counts.approved, color: 'bg-blue-50 border-blue-200',     text: 'text-blue-700' },
          { label: 'Visited',      value: counts.visited,  color: 'bg-green-50 border-green-200',   text: 'text-green-700' },
        ].map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-sm text-gray-500 font-medium">{s.label}</p>
            <p className={`text-3xl font-black mt-1 ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
        {/* Row 1: search + status */}
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>
          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white text-gray-700"
          >
            <option value="">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="visited">Visited</option>
          </select>
        </div>
        {/* Row 2: date range + clear */}
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">From</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider whitespace-nowrap">To</label>
            <input type="date" value={filterTo} min={filterFrom} onChange={e => setFilterTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors whitespace-nowrap">
              <i className="ri-close-line" /> Clear
            </button>
          )}
          {hasFilters && (
            <p className="text-xs text-gray-400 ml-auto">
              Showing <span className="font-semibold text-gray-700">{filtered.length}</span> of {reservations.length}
            </p>
          )}
        </div>
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
                    {/* Print */}
                    <button
                      onClick={() => printGuest(r)}
                      className="px-2.5 py-1.5 bg-gray-800 hover:bg-gray-900 text-white rounded-md text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      🖨️ Print
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
        <div
          className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4"
          onClick={() => setQrModal(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl flex flex-col w-[90%] max-w-md"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex justify-between items-center px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-900">Visitor QR Code</h2>
              <button
                onClick={() => setQrModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-xl"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* QR Code — scales with container */}
            <div className="flex justify-center px-5 pt-5 pb-4">
              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-full max-w-[240px] aspect-square flex items-center justify-center">
                <QRCodeSVG
                  value={`RESERVATION:${qrModal.id}`}
                  size="100%"
                  style={{ width: '100%', height: '100%', maxWidth: 210, maxHeight: 210 }}
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                  level="H"
                />
              </div>
            </div>

            {/* Details */}
            <div className="px-5 pb-4 border-t border-gray-100 pt-4 space-y-2.5">
              {[
                ['Name',   qrModal.name],
                ['Guests', qrModal.guest_count],
                ['Phone',  qrModal.phone],
                ['Date',   qrModal.date],
                ['Time',   qrModal.time?.slice(0, 5)],
                ['Status', STATUS_LABELS[qrModal.status]],
                ['ID',     qrModal.id.slice(0, 8).toUpperCase()],
              ].map(([label, val]) => (
                <div key={label} className="flex items-center justify-between gap-4 text-sm">
                  <span className="text-gray-500 shrink-0">{label}</span>
                  <span className="font-semibold text-gray-900 text-right break-all">{val}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5 pt-2">
              {qrModal.status === 'pending' && (
                <button
                  onClick={() => { updateStatus(qrModal.id, 'approved'); setQrModal(p => ({ ...p, status: 'approved' })) }}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  Approve
                </button>
              )}
              {qrModal.status === 'approved' && (
                <button
                  onClick={() => { updateStatus(qrModal.id, 'visited'); setQrModal(p => ({ ...p, status: 'visited' })) }}
                  className="flex-1 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-colors"
                >
                  ✓ Mark as Visited
                </button>
              )}
              <button
                onClick={() => setQrModal(null)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-700 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}
