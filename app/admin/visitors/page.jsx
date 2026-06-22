'use client'

import { useState, useEffect, useRef } from 'react'
import { getSupabaseClient } from '../../lib/supabase-client'
import { logAudit } from '../../lib/auditLog'
import { QRCodeSVG } from 'qrcode.react'
import QRCode from 'qrcode'
import {
  Users, CalendarDays, Clock, Search, X, QrCode, Printer, Download,
  CheckCircle2, Trash2, Filter, SlidersHorizontal, UserCheck,
  Users2, Hourglass, Check, RefreshCw, Palette, Loader2, ChevronDown,
  Eye, Phone, Calendar, Hash, FileText, UserCircle2, ShieldCheck,
} from 'lucide-react'

const STATUS_STYLES = {
  pending:  'bg-amber-100 text-amber-800',
  approved: 'bg-indigo-100 text-indigo-800',
  visited:  'bg-emerald-100 text-emerald-800',
}

const STATUS_LABELS = {
  pending:  'Pending',
  approved: 'Approved',
  visited:  'Visited',
}

function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      type="button"
      onClick={onChange}
      disabled={disabled}
      className={`relative inline-flex h-7 w-13 w-[52px] items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
        checked ? 'bg-indigo-600' : 'bg-gray-300'
      }`}
    >
      <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-md transition-transform ${
        checked ? 'translate-x-[28px]' : 'translate-x-1'
      }`} />
    </button>
  )
}

export default function VisitorsPage() {
  const [reservations, setReservations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [qrModal, setQrModal] = useState(null)
  const [faceModal, setFaceModal] = useState(null)  // { url, name }
  const [viewModal, setViewModal] = useState(null)  // full reservation object
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [longPressRow, setLongPressRow] = useState(null)
  const lpTimer = useRef(null)

  const startLongPress = (r) => {
    lpTimer.current = setTimeout(() => setLongPressRow(r), 500)
  }
  const cancelLongPress = () => {
    if (lpTimer.current) clearTimeout(lpTimer.current)
  }

  const [showTab, setShowTab] = useState(true)
  const [tabToggling, setTabToggling] = useState(false)
  const [availableDays, setAvailableDays] = useState(['1','2','3','4','5'])
  const [availableHours, setAvailableHours] = useState({ start: '09:00', end: '17:00' })
  const [savingSchedule, setSavingSchedule] = useState(false)
  const [scheduleMsg, setScheduleMsg] = useState('')

  // Appearance state
  const [bgColor,    setBgColor]    = useState('#0a0a0a')
  const [bgMode,     setBgMode]     = useState('solid')
  const [gradColor1, setGradColor1] = useState('#0a0a0a')
  const [gradColor2, setGradColor2] = useState('#1a1a2e')
  const [gradAngle,  setGradAngle]  = useState(135)
  const [savingBg,   setSavingBg]   = useState(false)
  const [savedBg,    setSavedBg]    = useState(false)
  const [settingsId, setSettingsId] = useState(1)
  const [appearanceOpen, setAppearanceOpen] = useState(false)

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
    fetchAppearance()
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

  const fetchAppearance = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    try {
      const { data } = await supabase.from('settings').select('id, visitors_bg_color').single()
      if (data) {
        setSettingsId(data.id)
        const val = data.visitors_bg_color || '#0a0a0a'
        setBgColor(val)
        if (val.startsWith('linear-gradient')) {
          const m = val.match(/linear-gradient\((\d+)deg,\s*([^,]+),\s*([^)]+)\)/)
          if (m) { setBgMode('gradient'); setGradAngle(parseInt(m[1])); setGradColor1(m[2].trim()); setGradColor2(m[3].trim()) }
        }
      }
    } catch {}
  }

  const saveAppearance = async () => {
    const supabase = getSupabaseClient()
    if (!supabase) return
    setSavingBg(true)
    try {
      const { error } = await supabase.from('settings').upsert([{ id: settingsId, visitors_bg_color: bgColor, updated_at: new Date().toISOString() }], { onConflict: 'id' })
      if (error) throw error
      setSavedBg(true)
      setTimeout(() => setSavedBg(false), 3000)
    } catch (err) {
      alert('Error saving appearance: ' + err.message)
    } finally { setSavingBg(false) }
  }

  const setGrad = (c1, c2, angle) => {
    setBgColor(`linear-gradient(${angle}deg, ${c1}, ${c2})`)
  }

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
    if (!res.ok) alert('Failed to save: ' + (json.error || 'Unknown error'))
    else setShowTab(newVal)
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
    const prev = reservations.find(r => r.id === id)
    await supabase.from('reservations').update({ status }).eq('id', id)
    logAudit('status_change', 'reservations', id, { from: prev?.status, to: status, name: prev?.name })
    fetchReservations()
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this reservation?')) return
    const supabase = getSupabaseClient()
    if (!supabase) return
    const prev = reservations.find(r => r.id === id)
    await supabase.from('reservations').delete().eq('id', id)
    logAudit('delete', 'reservations', id, { name: prev?.name, date: prev?.date })
    fetchReservations()
  }

  const filtered = reservations.filter(r => {
    if (search) {
      const q = search.toLowerCase().replace(/^#/, '')
      const matchName  = (r.name  || '').toLowerCase().includes(q)
      const matchPhone = (r.phone || '').includes(search.replace(/^#/, ''))
      const matchId    = r.id.slice(0, 8).toLowerCase().includes(q)
      if (!matchName && !matchPhone && !matchId) return false
    }
    if (filterFrom && r.date < filterFrom) return false
    if (filterTo && r.date > filterTo) return false
    if (filterStatus && r.status !== filterStatus) return false
    return true
  })

  const hasFilters = search || filterFrom || filterTo || filterStatus
  const clearFilters = () => { setSearch(''); setFilterFrom(''); setFilterTo(''); setFilterStatus('') }

  const printGuest = async (r) => {
    const origin = window.location.origin
    const ref = r.id.slice(0, 8).toUpperCase()
    const statusKu  = { pending: 'چاوەڕوانکراو', approved: 'پەسەندکراو', visited: 'سەردانکراو', cancelled: 'هەڵوەشاوەتەوە' }
    const statusEn  = { pending: 'Pending', approved: 'Approved', visited: 'Visited', cancelled: 'Cancelled' }
    const statusColor = { pending: '#92400e', approved: '#1d4ed8', visited: '#166534', cancelled: '#991b1b' }
    const statusBg    = { pending: '#fef9ec', approved: '#eff6ff', visited: '#f0fdf4', cancelled: '#fff1f2' }
    const statusDot   = { pending: '#f59e0b', approved: '#3b82f6', visited: '#10b981', cancelled: '#ef4444' }
    const dateFormatted = new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', { year: 'numeric', month: '2-digit', day: '2-digit' })
    const timeFormatted = (() => {
      const t = r.time?.slice(0,5)
      if (!t) return '—'
      const [h, m] = t.split(':').map(Number)
      const ampm = h >= 12 ? 'PM' : 'AM'
      const h12 = h % 12 || 12
      return `${String(h12).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`
    })()
    const qrTarget = `${origin}/reservation/${r.id}`
    // Convert logo and QR to data URLs before opening window — avoids cross-origin/timing issues
    const logoUrl = await fetch(`${origin}/favicon-32x32.png`)
      .then(res => res.blob())
      .then(blob => new Promise(resolve => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.readAsDataURL(blob) }))
    const qrDataUrl = await QRCode.toDataURL(qrTarget, { width: 220, margin: 1, errorCorrectionLevel: 'H', color: { dark: '#111111', light: '#ffffff' } })
    let faceDataUrl = null
    if (r.face_image_url) {
      try {
        faceDataUrl = await fetch(r.face_image_url)
          .then(res => res.blob())
          .then(blob => new Promise(resolve => { const fr = new FileReader(); fr.onload = () => resolve(fr.result); fr.readAsDataURL(blob) }))
      } catch {}
    }

    // Fetch address and museum name from settings
    let addrKu = 'سلێمانی، کوردستان، عێراق'
    let addrEn = 'Sulaymaniyah, Kurdistan, Iraq'
    let museumNameKr = 'مۆزەخانەی نیشتمانی ئەمنە سورەکە'
    let museumNameEn = 'Amna Suraka National Museum'
    try {
      const sb = getSupabaseClient()
      if (sb) {
        const { data: settings } = await sb.from('settings').select('contact_address_kr,contact_address_en,museum_name_kr,museum_name_en').single()
        if (settings?.contact_address_kr) addrKu = settings.contact_address_kr
        if (settings?.contact_address_en) addrEn = settings.contact_address_en
        if (settings?.museum_name_kr) museumNameKr = settings.museum_name_kr
        if (settings?.museum_name_en) museumNameEn = settings.museum_name_en
      }
    } catch {}

    const html = `<!DOCTYPE html>
<html lang="ku" dir="rtl">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>فۆڕمی سەردانکاران — ${r.name}</title>
<style>
  @font-face { font-family:'UniSalar'; src:url('${origin}/fonts/UniSalar.otf') format('opentype'); font-display:block; }
  @page { size: A4 portrait !important; margin: 0 !important; }
  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: 210mm !important; height: 297mm !important;
    margin: 0 !important; padding: 0 !important;
    overflow: hidden !important;
    background-color: #ffffff !important;
    -webkit-print-color-adjust: exact !important;
    print-color-adjust: exact !important;
  }
  body {
    font-family: 'UniSalar', Tahoma, Arial, sans-serif;
    color: #000;
  }
  .page-wrapper {
    width: 210mm; height: 297mm;
    box-sizing: border-box;
    position: relative;
    background: white;
    display: flex; flex-direction: column;
    overflow: hidden;
    page-break-after: always;
  }

  /* ── Gold top bar ── */
  .gold-bar { height: 6px; background: linear-gradient(90deg,#7a0000,#c8a96e,#7a0000); flex-shrink:0; }

  /* ── Header ── */
  .header {
    flex-shrink:0; padding:14px 28px;
    background:#7a0000;
    display:flex; align-items:center; justify-content:space-between;
  }
  .logo-side { display:flex; align-items:center; gap:12px; }
  .logo-box {
    width:46px; height:46px; border-radius:8px;
    overflow:hidden; flex-shrink:0;
    background:#fff; padding:3px;
    border:1.5px solid rgba(255,255,255,0.35);
  }
  .logo-box img { width:100%; height:100%; object-fit:contain; display:block; }
  .museum-name { color:#fff; font-family:'UniSalar',Tahoma,sans-serif; font-size:11pt; font-weight:700; line-height:1.4; }
  .museum-sub  { color:#fff; font-family:'UniSalar',Tahoma,sans-serif; font-size:7pt; margin-top:1px; }
  .pass-label  { text-align:left; }
  .pass-ku     { font-family:'UniSalar',Tahoma,sans-serif; font-size:7.5pt; font-weight:700; color:#fff; margin-bottom:3px; }
  .pass-title  { font-family:'UniSalar',Tahoma,sans-serif; font-size:17pt; font-weight:900; letter-spacing:0.2em; color:#fff; line-height:1; }
  .pass-ref    { font-family:'Courier New',Courier,monospace; font-size:7pt; color:#fff; margin-top:4px; letter-spacing:0.06em; }

  /* ── Status bar ── */
  .status-bar {
    flex-shrink:0; padding:7px 28px;
    display:flex; align-items:center; gap:8px;
    background:${statusBg[r.status]||'#fef9ec'};
    border-bottom:1px solid ${statusDot[r.status]||'#f59e0b'}50;
  }
  .status-dot  { width:9px; height:9px; border-radius:50%; background:${statusDot[r.status]||'#f59e0b'}; flex-shrink:0; }
  .status-text { font-family:'UniSalar',Tahoma,sans-serif; font-size:9.5pt; font-weight:700; color:#000; }

  /* ── Details section ── */
  .details {
    flex-shrink:0; padding:16px 28px 14px;
    background:#fff;
    border-top:1.5px solid #7a0000;
    border-bottom:1.5px solid #7a0000;
    direction:rtl;
  }
  .spacer { flex:1; }
  .section-title {
    font-family:'UniSalar',Tahoma,sans-serif;
    font-size:11pt; font-weight:800; color:#7a0000;
    margin-bottom:13px;
    display:flex; align-items:center; justify-content:center; gap:10px;
    letter-spacing:0.01em;
  }
  .section-title .deco { display:block; height:1.5px; width:48px; background:linear-gradient(90deg,transparent,#c8a96e); flex-shrink:0; }
  .section-title .deco-r { background:linear-gradient(90deg,#c8a96e,transparent); }
  .section-title .en { color:#7a0000; opacity:0.45; font-size:9pt; font-family:'UniSalar',Tahoma,sans-serif; }
  .fields-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
  .field {
    padding:10px 14px;
    background:#fff;
    border:1.5px solid #111;
    border-radius:8px;
    display:flex; flex-direction:column; align-items:center; text-align:center;
    box-shadow:0 2px 8px rgba(122,0,0,0.12);
  }
  .field.full-width { grid-column:1 / -1; }
  .field .lbl {
    font-family:'UniSalar',Tahoma,sans-serif;
    font-size:7.5pt; color:#7a0000; opacity:0.6;
    margin-bottom:4px; display:flex; align-items:center; justify-content:center; gap:4px;
    text-transform:uppercase; letter-spacing:0.05em;
  }
  .field .lbl .en { font-family:'UniSalar',Tahoma,sans-serif; }
  .field .val { font-family:'UniSalar',Tahoma,sans-serif; font-size:16pt; font-weight:800; color:#111; line-height:1.2; text-align:center; }
  .field .val.mono { font-family:'Courier New',Courier,monospace; font-size:14.5pt; direction:ltr; text-align:center; font-weight:900; color:#111; -webkit-text-stroke:0.4px #111; }
  .field .val.sm { font-family:'UniSalar',Tahoma,sans-serif; font-size:13pt; font-weight:500; color:#555; text-align:center; font-style:italic; }

  /* ── QR section ── */
  .qr-section {
    flex-shrink:0;
    display:flex; flex-direction:column; align-items:center; justify-content:center; gap:14px;
    background:#fff; padding:20px 28px;
  }
  .qr-row { display:flex; flex-direction:row; align-items:flex-start; justify-content:center; gap:36px; }
  .qr-col { display:flex; flex-direction:column; align-items:center; gap:10px; }
  .qr-wrapper { position:relative; display:inline-block; }
  .qr-frame {
    padding:3px; border-radius:16px;
    background:linear-gradient(135deg,#7a0000 0%,#c8a96e 50%,#7a0000 100%);
    box-shadow:0 8px 32px rgba(122,0,0,0.22), 0 2px 8px rgba(200,169,110,0.15);
  }
  .qr-inner { background:#fff; border-radius:13px; padding:13px; }
  .qr-frame img { display:block; width:215px; height:215px; }
  .face-frame {
    padding:3px; border-radius:16px;
    background:linear-gradient(135deg,#7a0000 0%,#c8a96e 50%,#7a0000 100%);
    box-shadow:0 8px 32px rgba(122,0,0,0.22), 0 2px 8px rgba(200,169,110,0.15);
  }
  .face-inner { background:#fff; border-radius:13px; overflow:hidden; }
  .face-inner img { display:block; width:215px; height:215px; object-fit:cover; }
  .qr-caption {
    font-family:'UniSalar',Tahoma,sans-serif;
    font-size:9pt; color:#000; text-align:center; line-height:1.8;
  }
  .qr-caption .en { font-family:'UniSalar',Tahoma,sans-serif; font-size:7.5pt; display:block; color:#000; opacity:0.5; }
  .qr-ref {
    font-family:'Courier New',Courier,monospace; font-size:8.5pt; font-weight:700;
    color:#7a0000; letter-spacing:0.1em; text-align:center;
    padding:5px 16px; border-radius:20px;
    background:linear-gradient(135deg,#7a000012,#c8a96e20);
    border:1px solid #c8a96e60;
  }

  /* ── Tear line ── */
  .tear { flex-shrink:0; display:flex; align-items:center; padding:0 8px; }
  .tear-circle { width:16px; height:16px; border-radius:50%; background:#e8e8e8; border:1px solid #d5d5d5; flex-shrink:0; }
  .tear-line   { flex:1; border-top:2px dashed #d5d5d5; }

  /* ── Footer ── */
  .footer {
    flex-shrink:0; padding:10px 28px; background:#111;
    display:flex; align-items:center; justify-content:space-between; direction:rtl;
  }
  .footer-ku   { font-family:'UniSalar',Tahoma,sans-serif; font-size:8.5pt; font-weight:700; color:#fff; }
  .footer-en   { font-family:'UniSalar',Tahoma,sans-serif; font-size:6.5pt; color:#fff; margin-top:2px; }
  .bottom-bar  { flex-shrink:0; height:6px; background:linear-gradient(90deg,#7a0000,#c8a96e,#7a0000); }
</style>
</head>
<body>
<div class="page-wrapper">

<div class="gold-bar"></div>

<div class="header">
  <div class="logo-side">
    <div class="logo-box"><img src="${logoUrl}" alt="M"/></div>
    <div>
      <div class="museum-name">${museumNameKr}</div>
      <div class="museum-sub">${museumNameEn}</div>
    </div>
  </div>
  <div class="pass-label">
    <div class="pass-ku">فۆڕمی سەردانکاران</div>
    <div class="pass-title">VISITOR PASS</div>
    <div class="pass-ref">REF: ${ref}</div>
  </div>
</div>

<div class="status-bar">
  <div class="status-dot"></div>
  <div class="status-text">${statusKu[r.status]||statusKu.pending}&nbsp;&nbsp;·&nbsp;&nbsp;${statusEn[r.status]||statusEn.pending}</div>
</div>

<div class="details">
  <div class="section-title"><span class="deco"></span>وردەکاری داواکاری <span class="en">· Reservation Details</span><span class="deco deco-r"></span></div>
  <div class="fields-grid">
    <div class="field">
      <div class="lbl">ناوی تەواو <span class="en">· Full Name</span></div>
      <div class="val">${r.name}</div>
    </div>
    <div class="field">
      <div class="lbl">ژمارەی مۆبایل <span class="en">· Phone Number</span></div>
      <div class="val mono">${r.phone}</div>
    </div>
    <div class="field">
      <div class="lbl">ژمارەی میوان <span class="en">· Number of Guests</span></div>
      <div class="val">${r.guest_count} کەس</div>
    </div>
    <div class="field">
      <div class="lbl">بەرواری سەردان <span class="en">· Visit Date</span></div>
      <div class="val mono">${dateFormatted}</div>
    </div>
    <div class="field full-width">
      <div class="lbl">کاتی سەردان <span class="en">· Visit Time</span></div>
      <div class="val mono">${timeFormatted}</div>
    </div>
    ${r.note?`<div class="field full-width"><div class="lbl">تێبینی <span class="en">· Note</span></div><div class="val sm">${r.note}</div></div>`:''}

  </div>
</div>

<div class="spacer"></div>

<div class="qr-section">
  <div class="qr-row">
    <div class="qr-col">
      <div class="qr-wrapper">
        <div class="qr-frame">
          <div class="qr-inner"><img src="${qrDataUrl}" alt="QR Code"/></div>
        </div>
      </div>
      <div class="qr-caption">
        سکان بکە بۆ پشتڕاستکردنەوە
        <span class="en">Scan to Verify</span>
      </div>
    </div>
    ${faceDataUrl ? `<div class="qr-col">
      <div class="face-frame">
        <div class="face-inner"><img src="${faceDataUrl}" alt="Visitor Face"/></div>
      </div>
      <div class="qr-caption">
        وێنەی میوان
        <span class="en">Visitor Photo</span>
      </div>
    </div>` : ''}
  </div>
  <div class="qr-ref">RESERVATION · ${ref}</div>
</div>

<div class="tear">
  <div class="tear-circle"></div>
  <div class="tear-line"></div>
  <div class="tear-circle"></div>
</div>

<div class="footer">
  <div>
    <div class="footer-ku">${museumNameKr} — ${addrKu}</div>
    <div class="footer-en">${museumNameEn} — ${addrEn}</div>
  </div>

</div>
<div class="bottom-bar"></div>

</div><!-- .page-wrapper -->
<script>window.onload = () => setTimeout(() => window.print(), 200);<\/script>
</body>
</html>`
    const win = window.open('', '_blank', 'width=794,height=1095')
    win.document.write(html)
    win.document.close()
  }

  const printGuests = async () => {
    const origin = window.location.origin
    const logoUrl = `${origin}/assets/images/logonav.png`
    let museumNameEn = 'Amna Suraka National Museum'
    try {
      const sb = getSupabaseClient()
      if (sb) {
        const { data: settings } = await sb.from('settings').select('museum_name_en').single()
        if (settings?.museum_name_en) museumNameEn = settings.museum_name_en
      }
    } catch {}
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
        <td class="center"><span class="badge" style="color:${statusColor[r.status]};background:${statusBg[r.status]}">${STATUS_LABELS[r.status]}</span></td>
      </tr>`).join('')
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Visitor Reservations — ${museumNameEn}</title>
<style>
  @page { size: A4 landscape; margin: 12mm 14mm 12mm 14mm; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 9pt; color: #111; background: #fff;
    -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .top-bar { height: 6px; background: #c0001a; margin: -12mm -14mm 0; }
  .header { display: flex; align-items: center; justify-content: space-between;
    padding: 12px 0 12px; border-bottom: 2px solid #111; margin-bottom: 12px; }
  .logo-wrap img { height: 46px; width: auto; object-fit: contain; }
  .header-right { text-align: right; font-size: 7.5pt; color: #666; line-height: 1.7; }
  .header-right strong { color: #111; }
  .title-bar { background: #111; color: #fff; padding: 8px 14px; margin-bottom: 12px;
    display: flex; align-items: center; justify-content: space-between; border-left: 5px solid #c0001a; }
  .title-bar h1 { font-size: 12pt; font-weight: 800; letter-spacing: 0.5px; }
  .title-bar span { font-size: 8pt; color: #aaa; }
  .summary { display: grid; grid-template-columns: repeat(5,1fr); gap: 8px; margin-bottom: 12px; }
  .card { border-radius: 6px; padding: 8px 10px; border: 1px solid #e5e7eb; text-align: center; border-top: 3px solid #c0001a; }
  .card .val { font-size: 18pt; font-weight: 900; line-height: 1.1; color: #111; }
  .card .lbl { font-size: 6.5pt; text-transform: uppercase; letter-spacing: 0.5px; margin-top: 2px; color: #888; }
  .card-guests .val { color: #c0001a; }
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
  .footer { margin-top: 12px; border-top: 2px solid #111; padding-top: 8px; display: flex; align-items: center; justify-content: space-between; font-size: 7pt; color: #888; }
  .footer-brand { font-weight: 700; color: #111; }
  .footer-red { color: #c0001a; font-weight: 700; }
</style>
</head>
<body>
<div class="top-bar"></div>
<div class="header">
  <div class="logo-wrap"><img src="${logoUrl}" alt="${museumNameEn}" /></div>
  <div class="header-right">
    <div><strong>Printed:</strong> ${printDate} at ${printTime}</div>
    <div><strong>Total Records:</strong> ${filtered.length}</div>
  </div>
</div>
<div class="title-bar">
  <h1>Visitor Reservations Report</h1>
  <span>${search ? `Filtered: "${search}"` : 'All Reservations'}</span>
</div>
<div class="summary">
  <div class="card"><div class="val">${counts.total}</div><div class="lbl">Total</div></div>
  <div class="card card-guests"><div class="val">${reservations.reduce((s,r)=>s+(Number(r.guest_count)||0),0)}</div><div class="lbl">Guests</div></div>
  <div class="card"><div class="val">${counts.pending}</div><div class="lbl">Pending</div></div>
  <div class="card"><div class="val">${counts.approved}</div><div class="lbl">Approved</div></div>
  <div class="card"><div class="val">${counts.visited}</div><div class="lbl">Visited</div></div>
</div>
<table>
  <thead>
    <tr>
      <th class="num">#</th><th>Name</th><th class="center">Guests</th>
      <th>Phone</th><th class="center">Date</th><th class="center">Time</th>
      <th>Note</th><th class="center">Status</th>
    </tr>
  </thead>
  <tbody>
    ${rows || '<tr><td colspan="8" style="text-align:center;padding:20px;color:#aaa">No reservations found.</td></tr>'}
  </tbody>
</table>
<div class="footer">
  <div class="footer-brand">${museumNameEn} · <span class="footer-red">Red Security</span> · Sulaymaniyah, Kurdistan</div>
  <div>Confidential — for internal use only</div>
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`
    const win = window.open('', '_blank', 'width=900,height=700')
    win.document.write(html)
    win.document.close()
  }

  const downloadCSV = () => {
    const headers = ['Name', 'Guests', 'Phone', 'Date', 'Time', 'Status', 'Note', 'Created']
    const rows = filtered.map(r => [
      r.name, r.guest_count, r.phone || '', r.date,
      r.time?.slice(0, 5) || '', r.status, r.note || '',
      new Date(r.created_at).toLocaleDateString('en-GB'),
    ])
    const escape = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = [headers, ...rows].map(row => row.map(escape).join(',')).join('\r\n')
    const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const counts = {
    total: reservations.length,
    guests: reservations.filter(r => r.status === 'visited').reduce((s, r) => s + (Number(r.guest_count) || 0), 0),
    pending: reservations.filter(r => r.status === 'pending').length,
    approved: reservations.filter(r => r.status === 'approved').length,
    visited: reservations.filter(r => r.status === 'visited').length,
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-gray-800 placeholder-gray-400'

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="max-w-6xl space-y-6 pt-4 sm:pt-6">

      {/* Header */}
      <div className="flex flex-wrap items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-indigo-950/40 shrink-0">
            <Users size={20} strokeWidth={1.8} className="text-white" />
          </span>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Visitor Reservations</h1>
            <p className="text-sm text-gray-400 mt-0.5">
              {reservations.length === 0 ? 'No reservations' : `${reservations.length} reservation${reservations.length !== 1 ? 's' : ''} total`}
            </p>
          </div>
        </div>
        {filtered.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-xl shadow-md shadow-emerald-950/30 transition-all"
            >
              <Download size={14} />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
            <button
              onClick={printGuests}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white rounded-xl shadow-md shadow-slate-950/30 transition-all"
            >
              <Printer size={14} />
              <span className="hidden sm:inline">Print All</span>
            </button>
          </div>
        )}
      </div>

      {/* Sidebar Tab Visibility Toggle */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-semibold text-gray-800">Sidebar Tab Visibility</p>
          <p className="text-sm text-gray-400 mt-0.5">
            {showTab ? 'Visitor Booking tab is visible on the public site' : 'Visitor Booking tab is hidden from the public site'}
          </p>
        </div>
        <div className="shrink-0">
          <Toggle checked={showTab} onChange={toggleTab} disabled={tabToggling} />
        </div>
      </div>

      {/* Appearance */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-100 cursor-pointer select-none" onClick={() => setAppearanceOpen(o => !o)}>
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center shadow shadow-purple-950/40">
            <Palette size={15} strokeWidth={2} className="text-white" />
          </span>
          <h2 className="font-semibold text-gray-800">Appearance</h2>
          <ChevronDown size={16} className={`ml-auto text-gray-400 transition-transform duration-200 ${appearanceOpen ? 'rotate-180' : ''}`} />
        </div>
        {appearanceOpen && (
        <div className="p-6">

          {/* Mode toggle */}
          <div className="flex items-center gap-2 mb-5">
            {['solid', 'gradient'].map(mode => (
              <button
                key={mode}
                type="button"
                onClick={() => {
                  setBgMode(mode)
                  if (mode === 'solid') setBgColor('#0a0a0a')
                  else setGrad(gradColor1, gradColor2, gradAngle)
                }}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold capitalize transition-all ${
                  bgMode === mode ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {mode === 'solid' ? '⬛ Solid' : '🌈 Gradient'}
              </button>
            ))}
          </div>

          {bgMode === 'solid' ? (
            <div className="flex items-center gap-3 flex-wrap">
              <input
                type="color"
                value={bgColor.startsWith('linear') ? '#0a0a0a' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                className="w-12 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white"
              />
              <input
                type="text"
                value={bgColor.startsWith('linear') ? '#0a0a0a' : bgColor}
                onChange={e => setBgColor(e.target.value)}
                placeholder="#0a0a0a"
                className={inputCls + ' w-32 font-mono'}
              />
              <button
                type="button"
                onClick={() => setBgColor('#0a0a0a')}
                className="px-3 py-2 text-xs font-medium text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Reset
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                {[
                  { label: 'Color 1 (Start)', val: gradColor1, isFirst: true },
                  { label: 'Color 2 (End)',   val: gradColor2, isFirst: false },
                ].map(({ label, val, isFirst }) => (
                  <div key={label}>
                    <label className="text-xs font-medium text-gray-500 mb-1.5 block">{label}</label>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={val}
                        onChange={e => {
                          const c1 = isFirst ? e.target.value : gradColor1
                          const c2 = isFirst ? gradColor2 : e.target.value
                          if (isFirst) setGradColor1(e.target.value); else setGradColor2(e.target.value)
                          setGrad(c1, c2, gradAngle)
                        }}
                        className="w-10 h-9 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shrink-0"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={e => {
                          const c1 = isFirst ? e.target.value : gradColor1
                          const c2 = isFirst ? gradColor2 : e.target.value
                          if (isFirst) setGradColor1(e.target.value); else setGradColor2(e.target.value)
                          setGrad(c1, c2, gradAngle)
                        }}
                        className={inputCls + ' font-mono text-xs'}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="text-xs font-medium text-gray-500 mb-2 block">Direction — {gradAngle}°</label>
                <div className="flex items-center gap-2 mb-2 flex-wrap">
                  {[
                    { label: '↓', angle: 180 }, { label: '↗', angle: 45  }, { label: '→', angle: 90  }, { label: '↘', angle: 135 },
                    { label: '↙', angle: 225 }, { label: '←', angle: 270 }, { label: '↖', angle: 315 }, { label: '↑', angle: 0   },
                  ].map(({ label, angle }) => (
                    <button
                      key={angle}
                      type="button"
                      onClick={() => { setGradAngle(angle); setGrad(gradColor1, gradColor2, angle) }}
                      className={`w-9 h-9 rounded-lg text-base font-bold transition-all ${
                        gradAngle === angle ? 'bg-purple-600 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
                <input
                  type="range" min="0" max="360" value={gradAngle}
                  onChange={e => { const a = parseInt(e.target.value); setGradAngle(a); setGrad(gradColor1, gradColor2, a) }}
                  className="w-full accent-purple-600"
                />
              </div>
            </div>
          )}

          {/* Preview */}
          <div className="mt-5">
            <label className="text-xs font-medium text-gray-500 mb-1.5 block">Preview</label>
            <div
              className="h-16 rounded-xl border border-gray-200 flex items-center justify-center transition-all"
              style={{ background: bgColor }}
            >
              <span style={{ color: '#fff', opacity: 0.4, fontSize: '11px', letterSpacing: '0.12em', textTransform: 'uppercase' }}>
                Visitors / Reserve Section Background
              </span>
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center justify-end gap-3 mt-5">
            {savedBg && (
              <span className="flex items-center gap-1.5 text-sm text-emerald-600 font-medium">
                <CheckCircle2 size={15} /> Saved
              </span>
            )}
            <button
              type="button"
              onClick={saveAppearance}
              disabled={savingBg}
              className="flex items-center gap-2 px-5 py-2.5 text-sm font-semibold bg-gradient-to-br from-purple-600 to-purple-900 hover:from-purple-700 hover:to-purple-950 text-white rounded-xl disabled:opacity-60 shadow-lg shadow-purple-950/30 transition-all"
            >
              {savingBg ? <><Loader2 size={15} className="animate-spin" /> Saving…</> : <><CheckCircle2 size={15} /> Save Appearance</>}
            </button>
          </div>

        </div>
        )}
      </div>

      {/* Availability Schedule */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2.5 px-5 py-4 border-b border-gray-100">
          <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center shadow shadow-indigo-950/30">
            <CalendarDays size={14} strokeWidth={1.8} className="text-white" />
          </span>
          <div>
            <p className="font-semibold text-gray-800 text-sm">Visitor Availability Schedule</p>
            <p className="text-xs text-gray-400">Set which days and hours visitors can book</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Days */}
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2.5">Available Days</p>
            <div className="flex flex-wrap gap-2">
              {DAYS.map(day => (
                <button
                  key={day.val}
                  onClick={() => toggleDay(day.val)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-colors ${
                    availableDays.includes(day.val)
                      ? 'bg-gradient-to-br from-indigo-600 to-indigo-800 text-white shadow shadow-indigo-950/20'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Hours */}
          <div className="flex items-end gap-6 flex-wrap">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock size={11} /> Open From
              </p>
              <input
                type="time"
                value={availableHours.start}
                onChange={e => setAvailableHours(p => ({ ...p, start: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                <Clock size={11} /> Open Until
              </p>
              <input
                type="time"
                value={availableHours.end}
                onChange={e => setAvailableHours(p => ({ ...p, end: e.target.value }))}
                className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
              />
            </div>
          </div>

          {/* Save */}
          <div className="flex items-center gap-3">
            <button
              onClick={saveSchedule}
              disabled={savingSchedule}
              className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 disabled:opacity-50 text-white rounded-xl shadow shadow-indigo-950/20 transition-all"
            >
              {savingSchedule ? <RefreshCw size={13} className="animate-spin" /> : <CheckCircle2 size={13} />}
              {savingSchedule ? 'Saving…' : 'Save Schedule'}
            </button>
            {scheduleMsg && (
              <span className={`text-sm font-medium ${scheduleMsg === 'Saved!' ? 'text-emerald-600' : 'text-red-600'}`}>
                {scheduleMsg}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: 'Total',        value: counts.total,    icon: Users,       grad: 'from-slate-600 to-slate-800',   shadow: 'shadow-slate-950/30',   text: 'text-slate-700',   bg: 'bg-slate-50 border-slate-100' },
          { label: 'Total Guests', value: counts.guests,   icon: Users2,      grad: 'from-violet-600 to-violet-800', shadow: 'shadow-violet-950/30',  text: 'text-violet-700',  bg: 'bg-violet-50 border-violet-100' },
          { label: 'Pending',      value: counts.pending,  icon: Hourglass,   grad: 'from-amber-500 to-amber-700',   shadow: 'shadow-amber-950/30',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-100' },
          { label: 'Approved',     value: counts.approved, icon: UserCheck,   grad: 'from-indigo-600 to-indigo-800', shadow: 'shadow-indigo-950/30',  text: 'text-indigo-700',  bg: 'bg-indigo-50 border-indigo-100' },
          { label: 'Visited',      value: counts.visited,  icon: CheckCircle2,grad: 'from-emerald-600 to-emerald-800',shadow:'shadow-emerald-950/30', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100' },
        ].map(s => (
          <div key={s.label} className={`rounded-2xl border p-4 ${s.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-medium text-gray-500">{s.label}</p>
              <span className={`w-7 h-7 rounded-lg bg-gradient-to-br ${s.grad} flex items-center justify-center shadow ${s.shadow}`}>
                <s.icon size={13} strokeWidth={1.8} className="text-white" />
              </span>
            </div>
            <p className={`text-3xl font-black ${s.text}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 space-y-3">
        <div className="flex gap-3 flex-wrap">
          <div className="relative flex-1 min-w-[160px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name, phone or booking ID..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm bg-white"
            />
          </div>
          <div className="relative">
            <SlidersHorizontal size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <select
              value={filterStatus}
              onChange={e => setFilterStatus(e.target.value)}
              className="pl-8 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white text-gray-700 appearance-none"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="visited">Visited</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3 flex-wrap items-center">
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">From</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-[200px]">
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">To</label>
            <input type="date" value={filterTo} min={filterFrom} onChange={e => setFilterTo(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white" />
          </div>
          {hasFilters && (
            <button onClick={clearFilters}
              className="flex items-center gap-1.5 px-3 py-2 text-sm text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors whitespace-nowrap">
              <X size={13} /> Clear
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
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-3.5 border-b border-gray-100">
          <Filter size={14} className="text-indigo-600" />
          <h2 className="font-semibold text-gray-800 text-sm">Reservations</h2>
          {filtered.length > 0 && (
            <span className="ml-auto bg-indigo-100 text-indigo-700 text-xs font-bold px-2 py-0.5 rounded-full">
              {filtered.length}
            </span>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Name</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Guests</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Phone</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Date</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Note</th>
                <th className="hidden md:table-cell px-4 py-3 text-center text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Face</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Status</th>
                <th className="hidden md:table-cell px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Created</th>
                <th className="px-2 sm:px-4 py-3 text-left text-xs font-semibold text-gray-400 uppercase tracking-wider whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-4 py-14 text-center text-gray-400">
                    <span className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center shadow-lg shadow-indigo-950/40 mx-auto mb-3">
                      <Users size={20} strokeWidth={1.6} className="text-white" />
                    </span>
                    <p className="text-sm font-medium text-gray-500">{search ? 'No results found.' : 'No reservations yet.'}</p>
                  </td>
                </tr>
              )}
              {filtered.map(r => (
                <tr
                  key={r.id}
                  className="hover:bg-gray-50/60 transition-colors select-none"
                  onMouseDown={() => startLongPress(r)}
                  onMouseUp={cancelLongPress}
                  onMouseLeave={cancelLongPress}
                  onTouchStart={() => startLongPress(r)}
                  onTouchEnd={cancelLongPress}
                  onTouchMove={cancelLongPress}
                  onContextMenu={e => e.preventDefault()}
                >
                  {/* Name — date + guests shown below on mobile */}
                  <td className="px-4 py-3">
                    <p className="font-semibold text-gray-900 whitespace-nowrap">{r.name}</p>
                    <p className="md:hidden text-xs text-gray-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                      <span>{r.date}</span>
                      <span>·</span>
                      <span>{r.guest_count} guests</span>
                    </p>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-600 text-center font-medium">{r.guest_count}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-600 whitespace-nowrap" dir="ltr">{r.phone}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-600 whitespace-nowrap">{r.date}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-600 whitespace-nowrap">{r.time?.slice(0, 5)}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-400 max-w-[130px] truncate italic">{r.note || '—'}</td>
                  <td className="hidden md:table-cell px-4 py-3 text-center">
                    {r.face_image_url
                      ? (
                        <button
                          onClick={() => setFaceModal({ url: r.face_image_url, name: r.name })}
                          className="relative inline-block group"
                          title="Click to view face photo"
                        >
                          <img
                            src={r.face_image_url}
                            alt="Face"
                            className="w-11 h-11 rounded-xl object-cover ring-2 ring-emerald-400/70 group-hover:ring-emerald-500 transition-all shadow-sm"
                          />
                          <span className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-xl transition-all">
                            <svg className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
                          </span>
                          <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center border border-white">
                            <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7"/></svg>
                          </span>
                        </button>
                      )
                      : (
                        <div className="w-11 h-11 rounded-xl bg-gray-100 flex items-center justify-center mx-auto text-gray-300">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"/></svg>
                        </div>
                      )
                    }
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${STATUS_STYLES[r.status]}`}>
                      {STATUS_LABELS[r.status]}
                    </span>
                  </td>
                  <td className="hidden md:table-cell px-4 py-3 text-gray-400 whitespace-nowrap text-xs">
                    {new Date(r.created_at).toLocaleDateString()}
                  </td>
                  {/* Actions — icon-only on mobile */}
                  <td className="pl-2 pr-4 sm:px-4 py-3 whitespace-nowrap">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setViewModal(r)}
                        className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-lg text-xs font-medium transition-all shadow-sm shadow-indigo-950/30"
                      >
                        <Eye size={12} />
                        <span className="hidden sm:inline">View</span>
                      </button>
                      <button
                        onClick={() => setQrModal(r)}
                        className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-xs font-medium transition-colors"
                      >
                        <QrCode size={12} />
                        <span className="hidden sm:inline">QR</span>
                      </button>
                      <button
                        onClick={() => printGuest(r)}
                        className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-gradient-to-br from-slate-700 to-slate-900 hover:from-slate-800 hover:to-slate-950 text-white rounded-lg text-xs font-medium transition-all"
                      >
                        <Printer size={12} />
                        <span className="hidden sm:inline">Print</span>
                      </button>
                      {r.status === 'pending' && (
                        <button
                          onClick={() => updateStatus(r.id, 'approved')}
                          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <Check size={12} />
                          <span className="hidden sm:inline">Approve</span>
                        </button>
                      )}
                      {r.status === 'approved' && (
                        <button
                          onClick={() => updateStatus(r.id, 'visited')}
                          className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-lg text-xs font-medium transition-colors"
                        >
                          <CheckCircle2 size={12} />
                          <span className="hidden sm:inline">Visited</span>
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(r.id)}
                        className="flex items-center gap-1 px-2 sm:px-2.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg text-xs font-medium transition-colors"
                      >
                        <Trash2 size={12} />
                        <span className="hidden sm:inline">Delete</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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
            {/* Modal header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-gray-100">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-600 to-indigo-900 flex items-center justify-center shadow shadow-indigo-950/30">
                <QrCode size={14} strokeWidth={1.8} className="text-white" />
              </span>
              <h2 className="text-base font-bold text-gray-900 flex-1">Visitor QR Code</h2>
              <button
                onClick={() => setQrModal(null)}
                className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* QR Code */}
            <div className="flex justify-center px-5 pt-5 pb-4">
              <div className="bg-white p-3 rounded-xl border border-gray-200 shadow-sm w-full max-w-[240px] aspect-square flex items-center justify-center">
                <QRCodeSVG
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${qrModal.id}`}
                  size="100%"
                  style={{ width: '100%', height: '100%', maxWidth: 210, maxHeight: 210 }}
                  bgColor="#ffffff"
                  fgColor="#0a0a0a"
                  level="H"
                />
              </div>
            </div>

            {/* Face image (if captured) */}
            {qrModal.face_image_url && (
              <div className="flex flex-col items-center gap-2 px-5 pb-4">
                <button
                  onClick={() => { setQrModal(null); setFaceModal({ url: qrModal.face_image_url, name: qrModal.name }) }}
                  className="relative group"
                  title="Click to view full face photo"
                >
                  <img
                    src={qrModal.face_image_url}
                    alt="Visitor face"
                    className="w-24 h-24 rounded-2xl object-cover ring-2 ring-emerald-400/60 group-hover:ring-emerald-500 transition-all"
                  />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/0 group-hover:bg-black/30 rounded-2xl transition-all">
                    <svg className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z"/></svg>
                  </div>
                  <span className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center border-2 border-white">
                    <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5 text-white"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414L8.414 15l-4.121-4.121a1 1 0 011.414-1.414L8.414 12.172l7.879-7.879a1 1 0 011.414 0z" clipRule="evenodd"/></svg>
                  </span>
                </button>
                <span className="text-xs font-medium text-emerald-600 flex items-center gap-1">
                  <svg viewBox="0 0 20 20" fill="currentColor" className="w-3.5 h-3.5"><path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd"/></svg>
                  Face ID Captured · tap to enlarge
                </span>
              </div>
            )}

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
                  <span className="text-gray-400 shrink-0">{label}</span>
                  <span className="font-semibold text-gray-900 text-right break-all">{val}</span>
                </div>
              ))}
            </div>

            {/* Actions */}
            <div className="flex gap-3 px-5 pb-5 pt-2">
              {qrModal.status === 'pending' && (
                <button
                  onClick={() => { updateStatus(qrModal.id, 'approved'); setQrModal(p => ({ ...p, status: 'approved' })) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  <Check size={14} /> Approve
                </button>
              )}
              {qrModal.status === 'approved' && (
                <button
                  onClick={() => { updateStatus(qrModal.id, 'visited'); setQrModal(p => ({ ...p, status: 'visited' })) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  <CheckCircle2 size={14} /> Mark as Visited
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

      {/* ── High-end Reservation View Modal ── */}
      {viewModal && (() => {
        const r = viewModal
        const sc = STATUS_STYLES[r.status] || STATUS_STYLES.pending
        const statusLabel = STATUS_LABELS[r.status] || r.status
        const statusDot = { pending: '#f59e0b', approved: '#6366f1', visited: '#10b981' }[r.status] || '#f59e0b'
        const ref = r.id.slice(0, 8).toUpperCase()
        const dateFormatted = r.date
          ? new Date(r.date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
          : '—'
        const timeFormatted = (() => {
          const t = r.time?.slice(0, 5)
          if (!t) return '—'
          const [h, m] = t.split(':').map(Number)
          return `${String(h % 12 || 12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${h >= 12 ? 'PM' : 'AM'}`
        })()
        const createdAt = r.created_at
          ? new Date(r.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })
          : '—'

        return (
          <div
            className="fixed inset-0 z-[70] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }}
            onClick={() => setViewModal(null)}
          >
            <div
              className="relative w-full max-w-3xl rounded-3xl overflow-hidden shadow-2xl flex flex-col"
              style={{ background: '#0f0f13', maxHeight: '90vh' }}
              onClick={e => e.stopPropagation()}
            >
              {/* ── Header bar ── */}
              <div className="flex items-center justify-between px-6 py-4 shrink-0"
                style={{ background: 'linear-gradient(135deg, #7a0000 0%, #3d0000 100%)', borderBottom: '1px solid rgba(200,169,110,0.25)' }}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
                    <UserCircle2 size={18} className="text-white" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight">{r.name}</h2>
                    <p className="text-[11px] font-mono text-white/50 mt-0.5">REF #{ref}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${sc}`}>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot }} />
                    {statusLabel}
                  </span>
                  <button
                    onClick={() => setViewModal(null)}
                    className="w-8 h-8 flex items-center justify-center rounded-xl bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-all"
                  >
                    <X size={15} />
                  </button>
                </div>
              </div>

              {/* Gold accent line */}
              <div className="h-[2px] shrink-0" style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

              {/* ── Body ── */}
              <div className="flex flex-col md:flex-row gap-0 overflow-y-auto flex-1 min-h-0">

                {/* Left column: face + QR */}
                <div className="md:w-56 shrink-0 flex flex-col items-center gap-5 px-6 py-6"
                  style={{ background: 'rgba(255,255,255,0.02)', borderRight: '1px solid rgba(255,255,255,0.06)' }}>

                  {/* Face photo */}
                  {r.face_image_url ? (
                    <div className="flex flex-col items-center gap-2 w-full">
                      <button
                        onClick={() => { setViewModal(null); setFaceModal({ url: r.face_image_url, name: r.name }) }}
                        className="relative group"
                        title="Click to enlarge"
                      >
                        <img
                          src={r.face_image_url}
                          alt={r.name}
                          className="rounded-2xl object-cover group-hover:brightness-110 transition-all"
                          style={{ width: 176, height: 220, border: '2px solid rgba(16,185,129,0.45)', boxShadow: '0 8px 32px rgba(16,185,129,0.15)' }}
                        />
                        <div className="absolute inset-0 rounded-2xl flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all" style={{ background: 'rgba(0,0,0,0.25)' }}>
                          <Eye size={20} className="text-white" />
                        </div>
                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold text-white whitespace-nowrap"
                          style={{ background: '#10b981', border: '1.5px solid #0f0f13' }}>
                          <ShieldCheck size={9} />
                          Face Verified
                        </div>
                      </button>
                      <p className="text-gray-600 text-[10px] uppercase tracking-wider mt-3">Face ID</p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <div className="rounded-2xl flex items-center justify-center"
                        style={{ width: 176, height: 176, background: 'rgba(255,255,255,0.04)', border: '2px dashed rgba(255,255,255,0.1)' }}>
                        <div className="flex flex-col items-center gap-2 text-gray-600">
                          <UserCircle2 size={40} strokeWidth={1} />
                          <span className="text-[11px]">No Face ID</span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* QR code */}
                  <div className="flex flex-col items-center gap-2">
                    <div className="p-3 rounded-xl" style={{ background: '#fff' }}>
                      <QRCodeSVG
                        value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${r.id}`}
                        size={120}
                        bgColor="#ffffff"
                        fgColor="#0a0a0a"
                        level="H"
                      />
                    </div>
                    <p className="text-gray-600 text-[10px] uppercase tracking-wider">Scan to Verify</p>
                  </div>
                </div>

                {/* Right column: all details */}
                <div className="flex-1 px-6 py-6 space-y-4 overflow-y-auto">

                  {/* Details grid */}
                  <div>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <FileText size={10} /> Reservation Details
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {[
                        { icon: UserCircle2, label: 'Full Name',     value: r.name,           wide: true  },
                        { icon: Phone,       label: 'Phone Number',  value: r.phone,           mono: true  },
                        { icon: Users,       label: 'Guests',        value: `${r.guest_count} ${Number(r.guest_count) === 1 ? 'person' : 'people'}` },
                        { icon: Calendar,    label: 'Visit Date',    value: dateFormatted,     wide: true  },
                        { icon: Clock,       label: 'Visit Time',    value: timeFormatted                  },
                        { icon: Hash,        label: 'Reservation ID', value: ref,              mono: true  },
                      ].map(({ icon: Icon, label, value, wide, mono }) => (
                        <div key={label}
                          className={`rounded-xl px-4 py-3 ${wide ? 'sm:col-span-2' : ''}`}
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <Icon size={10} className="text-amber-500/70" />
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</span>
                          </div>
                          <p className={`font-semibold text-white text-sm ${mono ? 'font-mono tracking-wide' : ''}`}>{value}</p>
                        </div>
                      ))}

                      {/* Status */}
                      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <ShieldCheck size={10} className="text-amber-500/70" />
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Status</span>
                        </div>
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${sc}`}>
                          <span className="w-1.5 h-1.5 rounded-full" style={{ background: statusDot }} />
                          {statusLabel}
                        </span>
                      </div>

                      {/* Submitted */}
                      <div className="rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                        <div className="flex items-center gap-1.5 mb-1">
                          <CalendarDays size={10} className="text-amber-500/70" />
                          <span className="text-[10px] text-gray-500 uppercase tracking-wider">Submitted</span>
                        </div>
                        <p className="text-white text-xs font-mono">{createdAt}</p>
                      </div>

                      {/* Note */}
                      {r.note && (
                        <div className="sm:col-span-2 rounded-xl px-4 py-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                          <div className="flex items-center gap-1.5 mb-1">
                            <FileText size={10} className="text-amber-500/70" />
                            <span className="text-[10px] text-gray-500 uppercase tracking-wider">Note</span>
                          </div>
                          <p className="text-gray-300 text-sm italic">{r.note}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px" style={{ background: 'rgba(255,255,255,0.07)' }} />

                  {/* Action buttons */}
                  <div className="flex flex-wrap gap-2">
                    {r.status === 'pending' && (
                      <button
                        onClick={() => { updateStatus(r.id, 'approved'); setViewModal(p => ({ ...p, status: 'approved' })) }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg,#4f46e5,#3730a3)', boxShadow: '0 4px 14px rgba(79,70,229,0.35)' }}
                      >
                        <Check size={14} /> Approve
                      </button>
                    )}
                    {r.status === 'approved' && (
                      <button
                        onClick={() => { updateStatus(r.id, 'visited'); setViewModal(p => ({ ...p, status: 'visited' })) }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                        style={{ background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 14px rgba(5,150,105,0.35)' }}
                      >
                        <CheckCircle2 size={14} /> Mark as Visited
                      </button>
                    )}
                    <button
                      onClick={() => { printGuest(r) }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#374151,#1f2937)', boxShadow: '0 4px 14px rgba(0,0,0,0.3)' }}
                    >
                      <Printer size={14} /> Print Pass
                    </button>
                    <button
                      onClick={() => { setViewModal(null); setQrModal(r) }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white transition-all"
                      style={{ background: 'linear-gradient(135deg,#1e293b,#0f172a)', border: '1px solid rgba(255,255,255,0.1)' }}
                    >
                      <QrCode size={14} /> QR Code
                    </button>
                    <button
                      onClick={() => { if (confirm(`Delete reservation for ${r.name}?`)) { handleDelete(r.id); setViewModal(null) } }}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ml-auto"
                      style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}
                    >
                      <Trash2 size={14} /> Delete
                    </button>
                  </div>

                </div>
              </div>

              {/* Bottom gold bar */}
              <div className="h-[3px] shrink-0" style={{ background: 'linear-gradient(to right, #7a0000, #c8a96e, #7a0000)' }} />
            </div>
          </div>
        )
      })()}

      {/* Face Image Lightbox */}
      {faceModal && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-sm"
          onClick={() => setFaceModal(null)}
        >
          <div
            className="relative flex flex-col items-center gap-4 p-5 rounded-3xl shadow-2xl max-w-sm w-full mx-4"
            style={{ background: '#111' }}
            onClick={e => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={() => setFaceModal(null)}
              className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors z-10"
            >
              <X size={15} />
            </button>

            {/* Header */}
            <div className="flex items-center gap-2 w-full pt-1">
              <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center shrink-0">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
              </div>
              <div>
                <p className="text-white text-sm font-bold">{faceModal.name}</p>
                <p className="text-emerald-400 text-xs font-medium">Face ID Verified</p>
              </div>
            </div>

            {/* Face photo */}
            <div className="relative">
              <img
                src={faceModal.url}
                alt={faceModal.name}
                className="rounded-2xl object-cover shadow-2xl"
                style={{ width: 260, height: 320, border: '2px solid rgba(16,185,129,0.5)' }}
              />
              {/* Emerald glow overlay on edges */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none"
                style={{ boxShadow: 'inset 0 0 0 1.5px rgba(16,185,129,0.4)' }} />
            </div>

            {/* Badge */}
            <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/20 border border-emerald-500/30">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"/></svg>
              <span className="text-emerald-300 text-xs font-semibold">Identity Verified via Face Scan</span>
            </div>

            <button
              onClick={() => setFaceModal(null)}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Long-press status card */}
      {longPressRow && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setLongPressRow(null)}
        >
          <div
            className="bg-white rounded-t-2xl w-full max-w-md shadow-2xl animate-in slide-in-from-bottom-4 duration-200"
            onClick={e => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>

            {/* Guest info */}
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="flex items-center gap-3">
                {longPressRow.face_image_url
                  ? (
                    <img
                      src={longPressRow.face_image_url}
                      alt="Face"
                      className="w-10 h-10 rounded-full object-cover shrink-0 ring-2 ring-emerald-400/60"
                    />
                  )
                  : (
                    <span className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center text-white text-sm font-bold shrink-0">
                      {longPressRow.name?.trim().split(' ').slice(0,2).map(w=>w[0]).join('').toUpperCase()}
                    </span>
                  )
                }
                <div className="min-w-0">
                  <p className="font-bold text-gray-900">{longPressRow.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-2 flex-wrap">
                    <span>{longPressRow.date}</span>
                    <span>·</span>
                    <span>{longPressRow.time?.slice(0,5)}</span>
                    <span>·</span>
                    <span>{longPressRow.guest_count} guests</span>
                  </p>
                </div>
                <span className={`ml-auto px-2.5 py-1 rounded-full text-xs font-semibold shrink-0 ${STATUS_STYLES[longPressRow.status]}`}>
                  {STATUS_LABELS[longPressRow.status]}
                </span>
              </div>
              {longPressRow.phone && (
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                  <span className="text-gray-300">📞</span>{longPressRow.phone}
                </p>
              )}
            </div>

            {/* Action buttons */}
            <div className="px-5 py-4 space-y-2.5 pb-8">
              {longPressRow.status === 'pending' && (
                <button
                  onClick={() => { updateStatus(longPressRow.id, 'approved'); setLongPressRow(null) }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-indigo-600 to-indigo-800 hover:from-indigo-700 hover:to-indigo-900 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  <Check size={16} /> Approve Reservation
                </button>
              )}
              {longPressRow.status === 'approved' && (
                <button
                  onClick={() => { updateStatus(longPressRow.id, 'visited'); setLongPressRow(null) }}
                  className="w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-br from-emerald-600 to-emerald-800 hover:from-emerald-700 hover:to-emerald-900 text-white rounded-xl text-sm font-semibold transition-all"
                >
                  <CheckCircle2 size={16} /> Mark as Visited
                </button>
              )}
              {longPressRow.status === 'visited' && (
                <div className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-semibold">
                  <CheckCircle2 size={16} /> Already Visited
                </div>
              )}
              <button
                onClick={() => { handleDelete(longPressRow.id); setLongPressRow(null) }}
                className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-sm font-semibold transition-colors"
              >
                <Trash2 size={16} /> Delete Reservation
              </button>
              <button
                onClick={() => setLongPressRow(null)}
                className="w-full py-3 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}
