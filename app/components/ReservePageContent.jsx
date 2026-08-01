'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import QRCode from 'qrcode'
import { QRCodeCanvas, QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import { useMuseumName } from '../lib/useMuseumName'
import Sidebar from './Sidebar'

const LiveCameraCapture = dynamic(() => import('./LiveCameraCapture'), { ssr: false })

const t = (ku, ar, en, lang) =>
  lang === 'ku' ? ku : lang === 'ar' ? ar : en

const fontStyle = (lang) =>
  lang === 'ku' ? 'UniSalar, Tahoma, sans-serif'
  : lang === 'ar' ? 'ArabicFont, Tahoma, sans-serif'
  : 'inherit'

const EMPTY = { name: '', guest_count: '', phone: '', date: '', time: '', note: '' }

const GOLD = '#c8a96e'
const RED  = '#7a0000'

const FaceScanIcon = ({ size = 24, color = 'currentColor', strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 9V5.5A1.5 1.5 0 015.5 4H9" />
    <path d="M15 4h3.5A1.5 1.5 0 0120 5.5V9" />
    <path d="M4 15v3.5A1.5 1.5 0 005.5 20H9" />
    <path d="M20 15v3.5a1.5 1.5 0 01-1.5 1.5H15" />
    <path d="M9 10.5v.5" strokeWidth="2" />
    <path d="M15 10.5v.5" strokeWidth="2" />
    <path d="M12 10.5v2" />
    <path d="M9.5 14.5c.7.7 1.5 1.1 2.5 1.1s1.8-.4 2.5-1.1" />
  </svg>
)

const STATUS_STYLE = {
  pending:  { bg: 'rgba(245,158,11,0.08)',  border: 'rgba(245,158,11,0.28)',  text: '#b45309', dot: '#f59e0b' },
  approved: { bg: 'rgba(16,185,129,0.08)',  border: 'rgba(16,185,129,0.28)',  text: '#047857', dot: '#10b981' },
  visited:  { bg: 'rgba(100,116,139,0.08)', border: 'rgba(100,116,139,0.28)', text: '#475569', dot: '#64748b' },
}

const RESERVE_CSS = `
  @keyframes reserveScanLine {
    0%   { top: 8%;  opacity: 0.5; }
    50%  { top: 84%; opacity: 1;   }
    100% { top: 8%;  opacity: 0.5; }
  }
  @keyframes reserveCornerGlow {
    0%, 100% { opacity: 0.55; }
    50%       { opacity: 1;   }
  }
  @keyframes reserveReveal {
    from { opacity: 0; transform: translateY(-10px); }
    to   { opacity: 1; transform: translateY(0);     }
  }
  @keyframes reserveGoldPulse {
    0%, 100% { box-shadow: 0 0 0 0 rgba(200,169,110,0); }
    60%       { box-shadow: 0 0 0 10px rgba(200,169,110,0.12); }
  }
  .r-reveal      { animation: reserveReveal 0.48s cubic-bezier(0.22,1,0.36,1) both; }
  .r-corner-glow { animation: reserveCornerGlow 2.2s ease-in-out infinite; }
  .r-scan-line   {
    position: absolute; left: 0; right: 0; height: 2px;
    background: linear-gradient(to right, transparent, #c8a96e 40%, #fff8 55%, #c8a96e 70%, transparent);
    animation: reserveScanLine 2.6s ease-in-out infinite;
    z-index: 10; pointer-events: none;
  }
  .r-gold-pulse  { animation: reserveGoldPulse 2.4s ease-in-out infinite; }
  @keyframes stepperBreath {
    0%, 100% { opacity: 1; box-shadow: 0 0 6px 0 rgba(200,169,110,0.35); }
    50%       { opacity: 0.82; box-shadow: 0 0 14px 3px rgba(200,169,110,0.55); }
  }
  .stepper-fill-breath { animation: stepperBreath 2.8s ease-in-out infinite; }
  .res-id        { font-family:'Roboto Mono','Courier New',Courier,monospace!important; direction:ltr!important; unicode-bidi:bidi-override!important; letter-spacing:.05em; }
  .date-input    { -webkit-appearance:none; appearance:none; }
  .date-input::-webkit-date-and-time-value { text-align:right; min-height:1.5em; }
  .date-input::-webkit-inner-spin-button,
  .date-input::-webkit-clear-button { display:none; }
  .date-input::-webkit-calendar-picker-indicator { filter:brightness(0); opacity:0.4; cursor:pointer; margin-inline-start:8px; }
  .date-input::-webkit-datetime-edit { padding:0; }
  .date-input::-webkit-datetime-edit-fields-wrapper { padding:0; }
`

export default function ReservePageContent({ initialLang = 'ku', inline = false }) {
  const [lang, setLang]               = useState(initialLang)
  const [pageTab, setPageTab]         = useState('book')
  const [form, setForm]               = useState(EMPTY)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)
  const [reservation, setReservation] = useState(null)

  const [faceImageUrl, setFaceImageUrl]           = useState(null)
  const [faceVerified, setFaceVerified]           = useState(false)
  const [faceUploading, setFaceUploading]         = useState(false)
  const [faceScanOpen, setFaceScanOpen]           = useState(false)
  const [hasStartedProcess, setHasStartedProcess] = useState(false)
  const [availableDays, setAvailableDays]         = useState(['1','2','3','4','5'])
  const [availableHours, setAvailableHours]       = useState({ start: '09:00', end: '17:00' })
  const qrRef      = useRef(null)
  const museumName = useMuseumName()

  const [trackPhone, setTrackPhone]     = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackResults, setTrackResults] = useState(null)
  const [trackError, setTrackError]     = useState('')
  const [bgColor, setBgColor]           = useState('#ffffff')

  const [editRes, setEditRes]           = useState(null)
  const [editForm, setEditForm]         = useState({})
  const [editSaving, setEditSaving]     = useState(false)
  const [editError, setEditError]       = useState('')

  useEffect(() => {
    const supabase = getSupabaseClient()
    supabase?.from('settings').select('visitors_bg_color').single()
      .then(({ data }) => { if (data?.visitors_bg_color) setBgColor(data.visitors_bg_color) })
  }, [])

  const searchByPhone = async () => {
    const phone = trackPhone.trim()
    if (!phone) return
    setTrackLoading(true); setTrackError(''); setTrackResults(null)
    try {
      const res = await fetch('/api/reservation/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Unknown error')
      setTrackResults(json.reservations)
    } catch {
      setTrackError(t('کێشەیەک ڕوویدا، دووبارە هەوڵبدەوە', 'حدث خطأ، حاول مرة أخرى', 'An error occurred, please try again', lang))
    } finally { setTrackLoading(false) }
  }

  const handleEditReservation = (res) => {
    setEditRes(res)
    setEditForm({ date: res.date || '', time: res.time?.slice(0,5) || '', guest_count: res.guest_count || '' })
    setEditError('')
  }

  const saveEdit = async () => {
    if (!editRes) return
    setEditSaving(true); setEditError('')
    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase
        .from('reservations')
        .update({ date: editForm.date, time: editForm.time, guest_count: Number(editForm.guest_count) })
        .eq('id', editRes.id)
      if (error) throw error
      setTrackResults(prev => prev.map(r => r.id === editRes.id ? { ...r, ...editForm, guest_count: Number(editForm.guest_count) } : r))
      setEditRes(null)
    } catch (err) {
      setEditError(t('تێچوونی پاشەکەوتکردن', 'فشل الحفظ', 'Save failed', lang))
    } finally { setEditSaving(false) }
  }

  const compressFace = (dataUrl, maxPx = 480, quality = 0.78) =>
    new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        try {
          const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
          const w = Math.round(img.width * scale)
          const h = Math.round(img.height * scale)
          const c = document.createElement('canvas')
          c.width = w; c.height = h
          c.getContext('2d').drawImage(img, 0, 0, w, h)
          resolve(c.toDataURL('image/jpeg', quality))
        } catch { resolve(dataUrl) }
      }
      img.onerror = () => resolve(dataUrl)
      img.src = dataUrl
    })

  const dataUrlToBlob = (dataUrl) => {
    const [header, b64] = dataUrl.split(',')
    const mime = header.match(/:(.*?);/)[1]
    const binary = atob(b64)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return new Blob([bytes], { type: mime })
  }

  const handleFaceCapture = async (dataUrl) => {
    setFaceVerified(true)
    setFaceScanOpen(false)
    setFaceImageUrl(dataUrl)
    setFaceUploading(true)
    try {
      const compressed = await compressFace(dataUrl, 480, 0.78)
      const blob = dataUrlToBlob(compressed)
      const fd = new FormData()
      fd.append('face', blob, 'face.jpg')
      const r    = await fetch('/api/reserve/upload-face', { method: 'POST', body: fd })
      const json = await r.json()
      if (r.ok && json.url) {
        setFaceImageUrl(json.url)
      } else {
        console.warn('[face-upload] API error:', json?.error)
      }
    } catch (err) {
      console.warn('[face-upload] failed:', err?.message || err)
    } finally {
      setFaceUploading(false)
    }
  }

  useEffect(() => { const saved = localStorage.getItem('museum-lang'); if (saved) setLang(saved) }, [])

  useEffect(() => {
    if (inline) return
    const params = new URLSearchParams(window.location.search)
    if (params.get('tab') === 'track') setPageTab('track')
  }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/settings?key=available_days').then(r => r.json()),
      fetch('/api/settings?key=available_hours').then(r => r.json()),
    ]).then(([daysRes, hoursRes]) => {
      if (daysRes.value) try { setAvailableDays(JSON.parse(daysRes.value)) } catch {}
      if (hoursRes.value) try { setAvailableHours(JSON.parse(hoursRes.value)) } catch {}
    }).catch(() => {})
    return () => {}
  }, [])

  const isRtl = lang === 'ku' || lang === 'ar'

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = true
    if (!form.guest_count || Number(form.guest_count) < 1) e.guest_count = true
    if (!form.phone.trim()) e.phone = true
    if (!form.date) { e.date = true } else {
      const dow = String(new Date(form.date + 'T12:00:00').getDay())
      if (!availableDays.includes(dow)) e.date = 'unavailable'
    }
    if (!form.time) { e.time = true } else if (form.time < availableHours.start || form.time > availableHours.end) { e.time = 'outofrange' }
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const res = await fetch('/api/reserve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          guest_count: Number(form.guest_count),
          phone: form.phone.trim(),
          date: form.date,
          time: form.time,
          note: form.note.trim() || null,
          ...(faceImageUrl ? { face_image_url: faceImageUrl } : {}),
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Unknown error')
      setReservation(json.data)
      if (!inline) {
        const slug = json.data.id.slice(0, 8).toUpperCase()
        window.history.replaceState(null, '', `?booking=${slug}`)
      }
    } catch (err) {
      alert(t('کێشەیەک ڕوویدا، دووبارە هەوڵبدەوە', 'حدث خطأ، حاول مرة أخرى', 'An error occurred, please try again', lang) + '\n\n' + err.message)
    } finally { setLoading(false) }
  }

  const downloadQR = async () => {
    let museumNameKr = 'مۆزەخانەی نیشتمانی ئەمنە سورەکە'
    let museumNameEn = 'Amna Suraka National Museum'
    try {
      const sb = getSupabaseClient()
      if (sb) {
        const { data: s } = await sb.from('settings').select('museum_name_kr,museum_name_en').single()
        if (s?.museum_name_kr) museumNameKr = s.museum_name_kr
        if (s?.museum_name_en) museumNameEn = s.museum_name_en
      }
    } catch {}

    let uniSalarLoaded = false
    try {
      const ff = new FontFace('UniSalar', 'url(/fonts/UniSalar.otf)')
      await ff.load(); document.fonts.add(ff); uniSalarLoaded = true
    } catch {}
    const kuFont = uniSalarLoaded ? 'UniSalar, Tahoma, sans-serif' : 'Tahoma, sans-serif'

    const logoImg = await new Promise(resolve => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null)
      img.src = '/android-chrome-192x192.png'
    })

    const faceImg = faceImageUrl ? await new Promise(resolve => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = faceImageUrl
    }) : null

    const drawCover = (ctx, img, x, y, w, h) => {
      const imgR = img.naturalWidth / img.naturalHeight
      const boxR = w / h
      let sx, sy, sw, sh
      if (imgR > boxR) {
        sh = img.naturalHeight; sw = sh * boxR
        sx = (img.naturalWidth - sw) / 2; sy = 0
      } else {
        sw = img.naturalWidth; sh = sw / boxR
        sx = 0; sy = (img.naturalHeight - sh) / 2
      }
      ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h)
    }

    const hasFace = !!faceImg
    const qrUrl = `${window.location.origin}/reservation/${reservation.id}`
    const qrPixels = hasFace ? 320 : 464
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: qrPixels, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0a0a0a', light: '#ffffff' } })
    const qrImg = await new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.src = qrDataUrl })

    const W = 520, LOGO_H = 80, GOLD_H = 3, TITLE_H = 56, PAD = 24
    const FOOTER_H = 184
    const QR_SIZE  = hasFace ? 264 : W - PAD * 2
    const FACE_W   = hasFace ? 176 : 0
    const FACE_GAP = hasFace ? 16  : 0
    const ROW_PAD  = 24
    const ROW_H    = QR_SIZE + ROW_PAD * 2
    const H = LOGO_H + GOLD_H + TITLE_H + GOLD_H + ROW_H + FOOTER_H + 5

    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')

    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)
    ctx.fillStyle = '#6b0000'; ctx.fillRect(0, 0, W, LOGO_H)

    const ICON_SIZE = 44, GAP = 14
    ctx.font = `bold 15px ${kuFont}`
    const titleW = ctx.measureText(museumNameKr).width
    ctx.font = '11px Arial, sans-serif'
    const subW = ctx.measureText(museumNameEn).width
    const textBlockW = Math.max(titleW, subW)
    const groupStartX = (W - (textBlockW + GAP + ICON_SIZE)) / 2
    const ICON_X = groupStartX + textBlockW + GAP
    const ICON_Y = (LOGO_H - ICON_SIZE) / 2

    if (logoImg) {
      const BP = 3
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(ICON_X - BP, ICON_Y - BP, ICON_SIZE + BP * 2, ICON_SIZE + BP * 2, 8); ctx.fill()
      ctx.save(); ctx.beginPath(); ctx.roundRect(ICON_X - BP, ICON_Y - BP, ICON_SIZE + BP * 2, ICON_SIZE + BP * 2, 8); ctx.clip()
      ctx.drawImage(logoImg, ICON_X - BP, ICON_Y - BP, ICON_SIZE + BP * 2, ICON_SIZE + BP * 2); ctx.restore()
    }

    const textRightX = groupStartX + textBlockW
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 15px ${kuFont}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'
    ctx.fillText(museumNameKr, textRightX, LOGO_H / 2 - 11)
    ctx.direction = 'ltr'; ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = '#9ca3af'; ctx.textAlign = 'right'
    ctx.fillText(museumNameEn, textRightX, LOGO_H / 2 + 11)

    let y = LOGO_H
    const drawGold = () => {
      const g = ctx.createLinearGradient(0, 0, W, 0)
      g.addColorStop(0, 'transparent'); g.addColorStop(0.5, '#c8a96e'); g.addColorStop(1, 'transparent')
      ctx.fillStyle = g; ctx.fillRect(0, y, W, GOLD_H); y += GOLD_H
    }
    drawGold()

    ctx.fillStyle = '#7a0000'; ctx.fillRect(0, y, W, TITLE_H)
    const resId = '#' + reservation.id.slice(0, 8).toUpperCase()
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 20px 'Courier New', Courier, monospace`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText(resId, W / 2, y + TITLE_H / 2)
    y += TITLE_H

    drawGold()

    ctx.fillStyle = '#111111'; ctx.fillRect(0, y, W, ROW_H)

    if (hasFace) {
      const groupW = QR_SIZE + FACE_GAP + FACE_W
      const groupX = (W - groupW) / 2
      const itemY  = y + ROW_PAD

      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.roundRect(groupX, itemY, QR_SIZE, QR_SIZE, 10); ctx.fill()
      ctx.drawImage(qrImg, groupX + 8, itemY + 8, QR_SIZE - 16, QR_SIZE - 16)

      const faceX   = groupX + QR_SIZE + FACE_GAP
      const IP      = 6
      const BADGE_H = 28
      const LABEL_H = 18
      const IMG_W   = FACE_W - IP * 2
      const IMG_H   = Math.round(IMG_W * 1.25)
      const PANEL_H = IP + IMG_H + 6 + BADGE_H + 4 + LABEL_H + IP
      const panelY  = itemY + Math.max(0, (QR_SIZE - PANEL_H) / 2)

      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath(); ctx.roundRect(faceX, panelY, FACE_W, PANEL_H, 12); ctx.fill()
      ctx.strokeStyle = 'rgba(16,185,129,0.6)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.roundRect(faceX, panelY, FACE_W, PANEL_H, 12); ctx.stroke()

      ctx.save()
      ctx.beginPath(); ctx.roundRect(faceX + IP, panelY + IP, IMG_W, IMG_H, 8); ctx.clip()
      drawCover(ctx, faceImg, faceX + IP, panelY + IP, IMG_W, IMG_H)
      ctx.restore()

      const badgeY = panelY + IP + IMG_H + 6
      ctx.fillStyle = '#10b981'
      ctx.beginPath(); ctx.roundRect(faceX + IP, badgeY, IMG_W, BADGE_H, 7); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Arial'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
      ctx.fillText('✓  Face Verified', faceX + FACE_W / 2, badgeY + BADGE_H / 2)

      const labelY = badgeY + BADGE_H + 4
      ctx.fillStyle = '#6b7280'; ctx.font = '9px Arial'
      ctx.fillText('Face ID', faceX + FACE_W / 2, labelY + LABEL_H / 2)
    } else {
      const qx = (W - QR_SIZE) / 2
      ctx.fillStyle = '#ffffff'; ctx.fillRect(qx, y + ROW_PAD, QR_SIZE, QR_SIZE)
      ctx.drawImage(qrImg, qx, y + ROW_PAD, QR_SIZE, QR_SIZE)
    }

    y += ROW_H

    ctx.fillStyle = '#111111'; ctx.fillRect(0, y, W, FOOTER_H)

    const drawFooterDivider = (dy) => {
      const gd = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
      gd.addColorStop(0, 'transparent'); gd.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gd.addColorStop(1, 'transparent')
      ctx.fillStyle = gd; ctx.fillRect(PAD, dy, W - PAD * 2, 1)
    }

    let fy = y + 20

    ctx.fillStyle = '#4b5563'; ctx.font = '8px Arial'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText('VISITOR NAME', W / 2, fy); fy += 15

    ctx.fillStyle = '#ffffff'; ctx.font = `bold 17px ${kuFont}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'
    ctx.fillText(reservation.name, W / 2, fy); fy += 22

    drawFooterDivider(fy); fy += 14

    const COL_W = (W - PAD * 2) / 3
    const colX  = [PAD + COL_W * 0.5, PAD + COL_W * 1.5, PAD + COL_W * 2.5]

    ctx.fillStyle = 'rgba(255,255,255,0.08)'
    ctx.fillRect(PAD + COL_W,     fy - 2, 1, 32)
    ctx.fillRect(PAD + COL_W * 2, fy - 2, 1, 32)

    ctx.fillStyle = '#4b5563'; ctx.font = '8px Arial'; ctx.direction = 'ltr'
    ;['DATE', 'TIME', 'GUESTS'].forEach((lbl, i) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(lbl, colX[i], fy + 4)
    })

    ctx.fillStyle = '#fbbf24'; ctx.font = "bold 12px 'Courier New', monospace"; ctx.direction = 'ltr'
    ;[reservation.date, (reservation.time || '').slice(0, 5), String(reservation.guest_count)].forEach((val, i) => {
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'
      ctx.fillText(val, colX[i], fy + 20)
    })
    fy += 36

    drawFooterDivider(fy); fy += 14

    ctx.fillStyle = '#4b5563'; ctx.font = '8px Arial'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText('BOOKING ID', W / 2, fy); fy += 14

    const badgeW = 200, badgeH = 30, badgeX = (W - badgeW) / 2
    ctx.fillStyle = 'rgba(16,185,129,0.1)'
    ctx.beginPath(); ctx.roundRect(badgeX, fy, badgeW, badgeH, 8); ctx.fill()
    ctx.strokeStyle = 'rgba(16,185,129,0.3)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(badgeX, fy, badgeW, badgeH, 8); ctx.stroke()
    ctx.fillStyle = '#34d399'; ctx.font = "bold 13px 'Courier New', monospace"
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText(resId, W / 2, fy + badgeH / 2)

    const bg = ctx.createLinearGradient(0, 0, W, 0)
    bg.addColorStop(0, '#7a0000'); bg.addColorStop(0.5, '#c8a96e'); bg.addColorStop(1, '#7a0000')
    ctx.fillStyle = bg; ctx.fillRect(0, y + FOOTER_H, W, 5)

    const a = document.createElement('a')
    a.download = `reservation-qr-${reservation.id.slice(0, 8)}.png`
    a.href = canvas.toDataURL('image/png'); a.click()
  }

  // ── Shared style objects ─────────────────────────────────────
  const homeHref = lang === 'ar' ? '/arabic' : lang === 'ku' ? '/kurdish' : '/'
  const fStyle   = { fontFamily: fontStyle(lang) }

  const pageBg = {
    background: '#ffffff',
  }

  const glassCard = {
    background: 'rgba(255,255,255,0.90)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '2px solid rgba(200,169,110,0.45)',
    borderRadius: 24,
    boxShadow: '0 20px 60px rgba(122,0,0,0.05), 0 1px 0 rgba(255,255,255,0.95) inset',
  }

  const luxInput = (hasErr) => ({
    background: 'rgba(255,255,255,0.95)',
    border: `1.5px solid ${hasErr ? '#ef4444' : 'rgba(203,213,225,0.8)'}`,
    borderRadius: 14,
    color: '#1e293b',
    width: '100%',
    padding: '13px 16px',
    paddingInlineStart: 44,
    outline: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: fontStyle(lang),
    colorScheme: 'light',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
  })

  const FIELD_ICONS = {
    name: 'ri-user-3-line',
    guest_count: 'ri-group-2-line',
    phone: 'ri-phone-line',
    date: 'ri-calendar-check-line',
    time: 'ri-time-line',
    note: 'ri-quill-pen-line',
  }

  const fieldsLocked = !faceVerified

  // Live stepper state
  const currentStep = faceVerified ? 2 : 1
  const fillWidth   = currentStep === 1 ? '0px' : currentStep === 2 ? 'calc(33.33% - 32px)' : currentStep === 3 ? 'calc(66.66% - 32px)' : 'calc(100% - 64px)'

  const BOOKING_STEPS = [
    { num: 1, ku: 'سکانی ڕووخسار', ar: 'مسح الوجه',         en: 'Face Scan'      },
    { num: 2, ku: 'داواکاری',       ar: 'التسجيل',           en: 'Details'        },
    { num: 3, ku: 'وەرگرتنی کۆد',  ar: 'الحصول على QR',    en: 'Get Pass'       },
    { num: 4, ku: 'پەسەندکردن',    ar: 'تأكيد الحجز',       en: 'Approve Booking'},
  ]

  const stepIcon = (num, color) => {
    if (num === 1) return <FaceScanIcon size={17} color={color} strokeWidth={2} />
    if (num === 2) return <i className="ri-file-text-line" style={{ fontSize: 16, color }} />
    if (num === 3) return <i className="ri-qr-code-line" style={{ fontSize: 16, color }} />
    return <i className="ri-checkbox-circle-line" style={{ fontSize: 16, color }} />
  }

  const LiveStepper = () => (
    <div style={{ ...glassCard, padding: '18px 20px 14px', position: 'relative' }}>
      <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        {/* Background bar */}
        <div style={{ position: 'absolute', top: 18, left: 32, right: 32, height: 2, background: 'rgba(203,213,225,0.85)', zIndex: 0 }} />
        {/* Fill bar — RTL: anchored right (step 1 side), grows left; LTR: anchored left */}
        <div className="stepper-fill-breath" style={{
          position: 'absolute', top: 18,
          ...(isRtl ? { right: 32 } : { left: 32 }),
          height: 3, width: fillWidth, borderRadius: 2,
          background: `linear-gradient(${isRtl ? 'to left' : 'to right'}, ${GOLD}, rgba(200,169,110,0.6))`,
          transition: 'width 0.5s ease-in-out',
          zIndex: 1,
        }} />

        {BOOKING_STEPS.map(step => {
          const completed = step.num < currentStep
          const active    = step.num === currentStep

          const nodeStyle = (completed || active) ? {
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: GOLD, border: `2px solid ${GOLD}`,
            boxShadow: active ? '0 4px 16px rgba(200,169,110,0.5)' : '0 2px 8px rgba(200,169,110,0.3)',
            transform: active ? 'scale(1.1)' : 'scale(1.05)',
            outline: active ? '4px solid rgba(200,169,110,0.22)' : 'none',
            outlineOffset: 2,
            transition: 'all 0.3s ease-out',
            position: 'relative', zIndex: 2,
          } : {
            width: 36, height: 36, borderRadius: '50%',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `linear-gradient(135deg, ${RED}, #5a0000)`,
            border: '2px solid rgba(200,169,110,0.25)',
            boxShadow: '0 2px 10px rgba(122,0,0,0.25)',
            color: '#fff',
            transition: 'all 0.3s ease-out',
            position: 'relative', zIndex: 2,
          }

          return (
            <div key={step.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', zIndex: 1 }}>
              <div style={nodeStyle}>
                {completed
                  ? <i className="ri-check-line" style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }} />
                  : stepIcon(step.num, '#fff')
                }
              </div>
              <span style={{
                fontSize: 10, fontWeight: completed ? 700 : active ? 800 : 700,
                color: completed ? '#1e293b' : active ? RED : RED,
                textAlign: 'center', display: 'inline-block',
                transform: active ? 'scale(1.05)' : 'scale(1)',
                transition: 'all 0.3s ease-out',
                ...fStyle,
              }}>
                {t(step.ku, step.ar, step.en, lang)}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )

  const field = (key, label, type = 'text', extra = {}) => {
    const icon        = FIELD_ICONS[key]
    const disabled    = fieldsLocked
    const isTextarea  = type === 'textarea'
    const isDateTime  = type === 'date' || type === 'time'
    const hasErr      = !!errors[key]

    const iconEl = icon ? (
      <span style={{
        position: 'absolute',
        top: isTextarea ? 15 : '50%',
        transform: isTextarea ? 'none' : 'translateY(-50%)',
        [isRtl ? 'right' : 'left']: 14,
        color: hasErr ? '#ef4444' : disabled ? '#cbd5e1' : GOLD,
        fontSize: 16,
        zIndex: 1,
        pointerEvents: 'none',
        lineHeight: 1,
      }}>
        <i className={icon} />
      </span>
    ) : null

    return (
      <div>
        <label style={{ display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 7, color: disabled ? '#94a3b8' : '#475569', letterSpacing: '0.08em', textTransform: 'uppercase', ...fStyle }}>
          {label}
          {key !== 'note' && <span style={{ color: disabled ? 'rgba(200,169,110,0.3)' : GOLD, marginInlineStart: 4 }}>*</span>}
        </label>
        <div style={{ position: 'relative' }}>
          {iconEl}
          {isTextarea ? (
            <textarea
              disabled={disabled}
              value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              rows={3}
              style={{ ...luxInput(hasErr), paddingInlineStart: 44, resize: 'none', cursor: disabled ? 'not-allowed' : 'text', opacity: disabled ? 0.5 : 1 }}
              onFocus={e  => { if (!disabled) { e.target.style.borderColor = 'rgba(200,169,110,0.7)'; e.target.style.boxShadow = '0 0 0 4px rgba(200,169,110,0.1)' } }}
              onBlur={e   => { e.target.style.borderColor = hasErr ? '#ef4444' : 'rgba(203,213,225,0.8)'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
              {...extra}
            />
          ) : (
            <input
              disabled={disabled}
              type={type}
              value={form[key]}
              onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
              className={`date-input${isDateTime ? ' picker-input' : ''}`}
              style={{ ...luxInput(hasErr), minHeight: isDateTime ? 50 : 'auto', cursor: disabled ? 'not-allowed' : 'auto', opacity: disabled ? 0.5 : 1 }}
              onFocus={e  => { if (!disabled) { e.target.style.borderColor = 'rgba(200,169,110,0.7)'; e.target.style.boxShadow = '0 0 0 4px rgba(200,169,110,0.1)' } }}
              onBlur={e   => { e.target.style.borderColor = hasErr ? '#ef4444' : 'rgba(203,213,225,0.8)'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
              {...extra}
            />
          )}
        </div>
        {hasErr && (
          <p style={{ color: '#ef4444', fontSize: 12, marginTop: 6, display: 'flex', alignItems: 'center', gap: 4, ...fStyle }}>
            <i className="ri-error-warning-line" style={{ fontSize: 13 }} />
            {errors[key] === 'unavailable'
              ? t('ئەم رۆژە بەردەست نییە', 'هذا اليوم غير متاح', 'This day is not available', lang)
              : errors[key] === 'outofrange'
              ? t(`کات دەبێت لە نێوان ${availableHours.start} و ${availableHours.end} بێت`, `يجب أن يكون الوقت بين ${availableHours.start} و ${availableHours.end}`, `Time must be between ${availableHours.start} and ${availableHours.end}`, lang)
              : t('ئەم خانەیە پێویستە', 'هذا الحقل مطلوب', 'This field is required', lang)
            }
          </p>
        )}
      </div>
    )
  }

  // ── HUD corner bracket elements ──────────────────────────────
  const hudCorners = (size = 22, color = GOLD) => (
    <>
      <span className="r-corner-glow" style={{ position: 'absolute', top: 12, left: 12, width: size, height: size, borderLeft: `2px solid ${color}`, borderTop: `2px solid ${color}`, borderRadius: '3px 0 0 0', zIndex: 2 }} />
      <span className="r-corner-glow" style={{ position: 'absolute', top: 12, right: 12, width: size, height: size, borderRight: `2px solid ${color}`, borderTop: `2px solid ${color}`, borderRadius: '0 3px 0 0', zIndex: 2 }} />
      <span className="r-corner-glow" style={{ position: 'absolute', bottom: 12, left: 12, width: size, height: size, borderLeft: `2px solid ${color}`, borderBottom: `2px solid ${color}`, borderRadius: '0 0 0 3px', zIndex: 2 }} />
      <span className="r-corner-glow" style={{ position: 'absolute', bottom: 12, right: 12, width: size, height: size, borderRight: `2px solid ${color}`, borderBottom: `2px solid ${color}`, borderRadius: '0 0 3px 0', zIndex: 2 }} />
    </>
  )

  // ── Reset helper ─────────────────────────────────────────────
  const resetBooking = () => {
    setReservation(null); setForm(EMPTY); setFaceImageUrl(null)
    setFaceVerified(false); setFaceScanOpen(false); setHasStartedProcess(false)
  }

  // ── SUCCESS SCREEN ───────────────────────────────────────────
  if (reservation) {
    const resId = '#' + reservation.id.slice(0, 8).toUpperCase()

    const successContent = (
      <div className={inline ? 'max-w-lg mx-auto py-10' : 'max-w-lg w-full'}>
        <style>{`.res-id{font-family:'Roboto Mono','Courier New',Courier,monospace!important;direction:ltr!important;unicode-bidi:bidi-override!important;letter-spacing:.05em}`}</style>

        <div className="h-px mb-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            <div className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ border: `1px solid rgba(200,169,110,0.25)`, background: 'rgba(200,169,110,0.04)' }}>
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.4)' }}>
                <i className="ri-checkbox-circle-fill text-green-400 text-4xl" />
              </div>
            </div>
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: GOLD, opacity: 0.6 }} />
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full" style={{ background: GOLD, opacity: 0.4 }} />
          </div>

          <div className="flex items-center justify-center gap-4 mb-3 w-full">
            <span className="block flex-1 max-w-[60px] h-px rounded-full" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <h1 className="text-2xl md:text-3xl font-black text-gray-900 text-center" style={fStyle}>
              {t('داواکارییەکەت تۆمارکرا!', 'تم تسجيل طلبك!', 'Reservation Submitted!', lang)}
            </h1>
            <span className="block flex-1 max-w-[60px] h-px rounded-full" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-gray-600 text-sm text-center leading-relaxed" style={fStyle}>
            {t('تکایە وێنەیەک لەم زانیارییانەی خوارەوە لای خۆت دابگرە ، بۆ ئاگاداربوون لە ڕەوشی داواکارییەکت', 'يرجى إظهار رمز QR هذا عند مدخل المتحف للتحقق', 'Please show this QR code at the museum entrance for verification', lang)}
          </p>
        </div>

        <div className="rounded-2xl overflow-hidden mb-6" style={{ boxShadow: '0 16px 60px rgba(0,0,0,0.7)', border: `1px solid rgba(200,169,110,0.25)` }}>
          <div className="flex items-center justify-between px-5 py-0" style={{ background: '#6b0000', minHeight: 72 }}>
            <div className="flex flex-col" style={{ direction: 'rtl' }}>
              <span className="font-bold text-white text-sm leading-tight" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                {museumName.kr}
              </span>
              <span className="text-gray-400 text-[10px] mt-0.5">{museumName.en}</span>
            </div>
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ms-3"
              style={{ background: '#fff', padding: 3, border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <img src="/android-chrome-192x192.png" alt="logo" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>

          <div className="h-[3px]" style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

          <div className="flex items-center justify-center py-3.5" style={{ background: RED }}>
            <bdo dir="ltr" className="res-id text-white font-bold text-lg tracking-widest">{resId}</bdo>
          </div>

          <div className="h-[3px]" style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

          <div className="flex items-center justify-center gap-4 px-6 py-6" ref={qrRef} style={{ background: '#111' }}>
            <div className="rounded-2xl p-4 shadow-2xl shrink-0" style={{ background: '#fff', border: `1.5px solid rgba(200,169,110,0.35)` }}>
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}`} size={faceImageUrl ? 150 : 190} bgColor="#ffffff" fgColor="#0a0a0a" level="H" />
            </div>

            {faceImageUrl && (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative">
                  <img
                    src={faceImageUrl}
                    alt="Face ID"
                    className="rounded-2xl object-cover shadow-2xl"
                    style={{ width: 110, height: 138, border: '1.5px solid rgba(16,185,129,0.5)' }}
                  />
                  <div
                    className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold text-white whitespace-nowrap"
                    style={{ background: '#10b981', border: '1.5px solid #000' }}
                  >
                    <i className="ri-shield-check-fill text-[9px]" />
                    {t('ڕووخسار پشکنراوە', 'تم التحقق', 'Verified', lang)}
                  </div>
                </div>
                <p className="text-gray-400 text-[10px] mt-3" style={fStyle}>
                  {t('ناسنامەی ڕووخسار', 'Face ID', 'Face ID', lang)}
                </p>
              </div>
            )}
          </div>

          <div className="px-5 pb-6 pt-5" style={{ background: '#111' }}>
            <div className="text-center mb-5">
              <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#4b5563', ...fStyle }}>
                {t('ناوی سەردانکار', 'اسم الزائر', 'Visitor Name', lang)}
              </p>
              <p className="text-xl font-black text-white leading-tight" style={fStyle}>
                {reservation.name}
              </p>
            </div>

            <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />

            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', ...fStyle }}>
                  {t('بەروار', 'التاريخ', 'Date', lang)}
                </p>
                <bdo dir="ltr" className="res-id block text-sm font-extrabold" style={{ color: '#fbbf24' }}>{reservation.date}</bdo>
              </div>
              <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', ...fStyle }}>
                  {t('کات', 'الوقت', 'Time', lang)}
                </p>
                <bdo dir="ltr" className="res-id block text-sm font-extrabold" style={{ color: '#fbbf24' }}>{(reservation.time || '').slice(0, 5)}</bdo>
              </div>
              <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', ...fStyle }}>
                  {t('میوان', 'الضيوف', 'Guests', lang)}
                </p>
                <bdo dir="ltr" className="res-id block text-sm font-extrabold text-white">{reservation.guest_count}</bdo>
              </div>
            </div>

            <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />

            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[9px] uppercase tracking-widest" style={{ color: '#4b5563', ...fStyle }}>
                {t('ناسنامەی داواکاری', 'معرف الحجز', 'Booking ID', lang)}
              </p>
              <div className="flex items-center gap-2 px-4 py-2 rounded-xl"
                style={{ background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)', boxShadow: '0 0 16px rgba(16,185,129,0.07)' }}>
                <i className="ri-fingerprint-line text-xs" style={{ color: '#10b981' }} />
                <bdo dir="ltr" className="res-id text-sm font-black" style={{ color: '#34d399' }}>{resId}</bdo>
              </div>
            </div>
          </div>

          <div className="h-[5px]" style={{ background: 'linear-gradient(to right, #7a0000, #c8a96e, #7a0000)' }} />
        </div>

        <div className="flex flex-col gap-3">
          <button onClick={downloadQR}
            className="w-full flex items-center justify-center gap-2 py-4 text-white text-base font-bold rounded-2xl transition-all hover:brightness-110"
            style={{ background: RED, border: `1px solid rgba(200,169,110,0.35)`, boxShadow: '0 4px 20px rgba(122,0,0,0.35)', ...fStyle }}>
            <i className="ri-download-2-line text-lg" style={{ color: GOLD }} />
            {t('داونلۆدی QR', 'تحميل QR', 'Download QR', lang)}
          </button>
          <div className="flex gap-3">
            <button onClick={resetBooking}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-2xl transition-all hover:brightness-110"
              style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: '#374151', ...fStyle }}>
              <i className="ri-add-line" />
              {t('داواکارییەکی تر', 'حجز آخر', 'New Booking', lang)}
            </button>
            {!inline && (
              <Link href={homeHref}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-sm font-bold rounded-2xl transition-all hover:brightness-110"
                style={{ background: 'rgba(0,0,0,0.06)', border: '1px solid rgba(0,0,0,0.1)', color: '#374151', ...fStyle }}>
                <i className="ri-home-5-line" />
                {t('سەرەتا', 'الرئيسية', 'Home', lang)}
              </Link>
            )}
          </div>
        </div>

        <div className="h-px mt-10" style={{ background: `linear-gradient(to right, transparent, rgba(200,169,110,0.2), transparent)` }} />
      </div>
    )

    if (inline) return (
      <section id="reserve" className="text-slate-900 px-4 py-6 h-[calc(100dvh-4rem)] md:h-screen overflow-y-auto flex items-center justify-center" style={pageBg} dir={isRtl ? 'rtl' : 'ltr'}>
        {successContent}
      </section>
    )
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-8 md:pt-16 md:pb-16 md:pl-[88px]" style={pageBg}>
        <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />
        {successContent}
      </div>
    )
  }

  // ── MAIN RENDER ──────────────────────────────────────────────
  const Wrapper = inline ? 'section' : 'div'

  const TABS = [
    { id: 'book',  ku: 'تۆمارکردن',            ar: 'حجز جديد',    en: 'New Booking'       },
    { id: 'track', ku: 'بەدواداچوونی داواکاری', ar: 'تتبع الحجز', en: 'Track Reservation' },
  ]

  return (
    <Wrapper
      id={inline ? 'reserve' : undefined}
      className={
        inline
          ? 'px-4 md:px-8 py-5 h-[calc(100dvh-4rem)] md:h-screen overflow-y-auto'
          : 'min-h-dvh flex flex-col px-4 pt-16 pb-10 md:pt-10 md:pb-12 md:pl-[88px]'
      }
      style={pageBg}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <style>{RESERVE_CSS}</style>

      {/* Ambient gold glow */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '55vh', background: 'radial-gradient(ellipse 80% 50% at 50% -5%, rgba(200,169,110,0.09) 0%, transparent 70%)', pointerEvents: 'none', zIndex: 0 }} />

      {!inline && <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />}

      <div className="relative z-10 w-full max-w-4xl mx-auto flex flex-col">

        {/* ── Header ───────────────────────────────────────────── */}
        <div className="text-center mb-5 md:mb-8 max-w-2xl mx-auto flex-shrink-0">
          {!inline && (
            <Link
              href={homeHref}
              className="inline-flex items-center gap-2 mb-4 transition-all"
              style={{ background: RED, border: 'none', borderRadius: 12, padding: '7px 14px', color: '#fff', fontSize: 13, fontWeight: 700, textDecoration: 'none', ...fStyle }}
            >
              <i className="ri-home-5-line" style={{ fontSize: 15 }} />
              {t('سەرەتا', 'الرئيسية', 'Home', lang)}
            </Link>
          )}

          <div className="flex items-center justify-center gap-4 mb-2">
            <span className="block w-10 md:w-16 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <h1 className="text-xl md:text-4xl font-black text-slate-900" style={fStyle}>
              {t('داواکاری سەردانکردن', 'حجز زيارة', 'Reserve a Visit', lang)}
            </h1>
            <span className="block w-10 md:w-16 h-px" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-slate-500 text-sm leading-relaxed" style={fStyle}>
            {t('داواکاری پێشکەش بکە بۆ سەردانیکردنی مۆزەخانە', 'أكمل النموذج وستحصل على رمز QR لمدخل المتحف', 'Fill the form and receive a QR code for museum entry', lang)}
          </p>
        </div>

        {/* ── Tab switcher ─────────────────────────────────────── */}
        <div className="max-w-md mx-auto w-full mb-5 md:mb-8 flex-shrink-0">
          <div style={{ background: 'rgba(241,245,249,0.9)', border: '1px solid rgba(226,232,240,0.8)', borderRadius: 999, padding: 5, boxShadow: '0 2px 10px rgba(0,0,0,0.04) inset' }}>
            <div className="flex gap-1">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setPageTab(tab.id); setTrackResults(null); setTrackError('')
                    if (!inline) window.history.replaceState({}, '', `?tab=${tab.id}`)
                  }}
                  style={{
                    flex: 1,
                    padding: '10px 16px',
                    borderRadius: 999,
                    fontSize: 13,
                    fontWeight: 700,
                    transition: 'all 0.3s cubic-bezier(0.22,1,0.36,1)',
                    background: pageTab === tab.id ? RED : 'transparent',
                    color: pageTab === tab.id ? '#fff' : '#64748b',
                    boxShadow: pageTab === tab.id ? `0 4px 18px rgba(122,0,0,0.32)` : 'none',
                    border: pageTab === tab.id ? `1px solid rgba(200,169,110,0.28)` : '1px solid transparent',
                    cursor: 'pointer',
                    ...fStyle,
                  }}
                >
                  {t(tab.ku, tab.ar, tab.en, lang)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Tab content ──────────────────────────────────────── */}
        <div className={inline ? 'overflow-y-auto' : ''}>

          {/* ────────── TRACK TAB ────────── */}
          {pageTab === 'track' && (
            <div className="max-w-2xl mx-auto space-y-4">

              {/* Search card */}
              <div style={{ ...glassCard, position: 'relative', overflow: 'hidden', padding: '24px' }}>
                <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

                <p className="text-slate-500 text-sm mb-4" style={fStyle}>
                  {t('ژمارەی تەلەفۆنەکەت بنووسە بۆ بینینی بارودۆخی داواکارییەکەت', 'أدخل رقم هاتفك لمعرفة حالة حجزك', 'Enter your phone number to check your reservation status', lang)}
                </p>

                <div className="flex gap-2">
                  <div style={{ flex: 1, position: 'relative' }}>
                    <span style={{ position: 'absolute', top: '50%', transform: 'translateY(-50%)', [isRtl ? 'right' : 'left']: 14, color: GOLD, fontSize: 16, pointerEvents: 'none' }}>
                      <i className="ri-phone-line" />
                    </span>
                    <input
                      type="tel"
                      value={trackPhone}
                      onChange={e => setTrackPhone(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && searchByPhone()}
                      placeholder="07XX XXX XXXX"
                      dir="ltr"
                      style={{ ...luxInput(false), paddingInlineStart: 44 }}
                      onFocus={e => { e.target.style.borderColor = 'rgba(200,169,110,0.7)'; e.target.style.boxShadow = '0 0 0 4px rgba(200,169,110,0.1)' }}
                      onBlur={e  => { e.target.style.borderColor = 'rgba(203,213,225,0.8)'; e.target.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)' }}
                    />
                  </div>
                  <button
                    onClick={searchByPhone}
                    disabled={trackLoading || !trackPhone.trim()}
                    style={{ background: `linear-gradient(135deg, ${RED}, #990000)`, border: '1px solid rgba(200,169,110,0.3)', borderRadius: 14, padding: '0 20px', color: '#fff', fontWeight: 700, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', boxShadow: '0 4px 16px rgba(122,0,0,0.25)', opacity: (trackLoading || !trackPhone.trim()) ? 0.5 : 1, transition: 'opacity 0.2s', ...fStyle }}
                  >
                    {trackLoading
                      ? <span className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                      : <i className="ri-search-line" />}
                    {t('گەڕان', 'بحث', 'Search', lang)}
                  </button>
                </div>
              </div>

              {trackError && (
                <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 14, padding: '12px 16px' }}>
                  <p className="text-red-500 text-sm flex items-center gap-2" style={fStyle}>
                    <i className="ri-error-warning-line" />{trackError}
                  </p>
                </div>
              )}

              {trackResults !== null && trackResults.length === 0 && (
                <div style={{ ...glassCard, padding: '48px 24px', textAlign: 'center' }}>
                  <i className="ri-inbox-line text-4xl mb-3 block" style={{ color: '#94a3b8' }} />
                  <p className="text-slate-400 text-sm" style={fStyle}>{t('هیچ داواکارییەک نەدۆزرایەوە', 'لا توجد حجوزات بهذا الرقم', 'No reservations found for this number', lang)}</p>
                </div>
              )}

              {trackResults && trackResults.length > 0 && (
                <div className="space-y-4">
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.08em', ...fStyle }}>
                    {trackResults.length} {t('داواکاری', 'حجز', 'reservation(s) found', lang)}
                  </p>
                  {trackResults.map(res => {
                    const sc = STATUS_STYLE[res.status] || STATUS_STYLE.pending
                    const statusLabel = {
                      pending:  t('چاوەڕوان بە', 'قيد الانتظار', 'Pending',  lang),
                      approved: t('پەسەندکراوە', 'مقبول',        'Approved', lang),
                      visited:  t('سەردانکرا',   'تمت الزيارة',  'Visited',  lang),
                    }[res.status] || res.status

                    // stepper progress
                    const isApproved = res.status === 'approved' || res.status === 'visited'
                    const trackStep  = isApproved ? 4 : 3
                    const trackFill  = isApproved ? 'calc(100% - 64px)' : 'calc(66.66% - 43px)'

                    const TRACK_STEPS = [
                      { num: 1, icon: <FaceScanIcon size={15} color="inherit" strokeWidth={2} /> },
                      { num: 2, icon: <i className="ri-file-text-line" style={{ fontSize: 14 }} /> },
                      { num: 3, icon: <i className="ri-qr-code-line"   style={{ fontSize: 14 }} /> },
                      { num: 4, icon: <i className="ri-checkbox-circle-line" style={{ fontSize: 14 }} /> },
                    ]
                    const TRACK_LABELS = [
                      { ku: 'سکانی ڕووخسار', ar: 'مسح الوجه',      en: 'Face Scan' },
                      { ku: 'داواکاری',       ar: 'التسجيل',        en: 'Details'   },
                      { ku: 'وەرگرتنی کۆد',  ar: 'الحصول على QR', en: 'Get Code'  },
                      { ku: 'پەسەندکردن',    ar: 'تأكيد الحجز',    en: 'Approve'   },
                    ]

                    const isEditing = editRes?.id === res.id
                    const qrValue   = `${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${res.id}`

                    return (
                      <div key={res.id} className="r-reveal" style={{ ...glassCard, border: `2px solid ${sc.border}`, padding: '24px 20px 20px', overflow: 'hidden' }}>

                        {/* top gold accent line */}
                        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: `linear-gradient(to right, transparent, ${GOLD} 40%, ${sc.dot} 70%, transparent)`, borderRadius: '24px 24px 0 0' }} />

                        {/* ── QR + Face showcase ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 16, marginBottom: 20, paddingTop: 4 }}>
                          {/* QR */}
                          <div style={{ background: '#fff', padding: 8, borderRadius: 16, border: `1.5px solid rgba(200,169,110,0.35)`, boxShadow: '0 4px 16px rgba(200,169,110,0.12)', flexShrink: 0 }}>
                            <QRCodeCanvas
                              value={qrValue}
                              size={typeof window !== 'undefined' && window.innerWidth < 640 ? 90 : 110}
                              bgColor="#ffffff"
                              fgColor="#0a0a0a"
                              level="H"
                            />
                          </div>

                          {/* Face photo or placeholder */}
                          <div style={{ position: 'relative', flexShrink: 0 }}>
                            {res.face_image_url ? (
                              <>
                                <img
                                  src={res.face_image_url}
                                  alt="face"
                                  style={{
                                    width: typeof window !== 'undefined' && window.innerWidth < 640 ? 90 : 110,
                                    height: typeof window !== 'undefined' && window.innerWidth < 640 ? 90 : 110,
                                    borderRadius: 16,
                                    objectFit: 'cover',
                                    border: `2px solid rgba(16,185,129,0.45)`,
                                    boxShadow: '0 4px 16px rgba(16,185,129,0.15)',
                                    display: 'block',
                                  }}
                                />
                                <span style={{ position: 'absolute', bottom: -6, right: -6, width: 22, height: 22, borderRadius: '50%', background: '#10b981', border: '2px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <i className="ri-check-line" style={{ fontSize: 11, color: '#fff', fontWeight: 'bold' }} />
                                </span>
                              </>
                            ) : (
                              <div style={{ width: 110, height: 110, borderRadius: 16, border: `2px dashed rgba(200,169,110,0.35)`, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(200,169,110,0.04)' }}>
                                <FaceScanIcon size={36} color={GOLD} strokeWidth={1.2} />
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ── Name + Edit ── */}
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4 }}>
                          <p style={{ fontSize: 18, fontWeight: 800, color: '#0f172a', ...fStyle }}>{res.name}</p>
                          {res.status === 'pending' && (
                            <button
                              onClick={() => isEditing ? setEditRes(null) : handleEditReservation(res)}
                              title={t('دەستکاریکردن', 'تعديل', 'Edit', lang)}
                              style={{ padding: '5px 7px', borderRadius: '50%', border: 'none', cursor: 'pointer', background: isEditing ? 'rgba(122,0,0,0.10)' : 'transparent', color: RED, transition: 'all 0.2s' }}
                              onMouseEnter={e => e.currentTarget.style.background = 'rgba(122,0,0,0.10)'}
                              onMouseLeave={e => { if (!isEditing) e.currentTarget.style.background = 'transparent' }}
                            >
                              <i className={isEditing ? 'ri-close-line' : 'ri-edit-line'} style={{ fontSize: 17 }} />
                            </button>
                          )}
                        </div>
                        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', letterSpacing: '0.06em', marginBottom: 18 }}>#{res.id.slice(0,8).toUpperCase()}</p>

                        {/* ── Inline Edit Form ── */}
                        {isEditing && (
                          <div className="r-reveal" style={{ background: 'rgba(122,0,0,0.03)', border: '1.5px solid rgba(122,0,0,0.12)', borderRadius: 16, padding: '16px', marginBottom: 16 }}>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                              <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4, ...fStyle }}>{t('بەروار','التاريخ','Date',lang)}</label>
                                <input type="date" value={editForm.date} onChange={e => setEditForm(f => ({ ...f, date: e.target.value }))}
                                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid rgba(203,213,225,0.8)', fontSize: 13, background: '#fff', color: '#1e293b', outline: 'none' }} />
                              </div>
                              <div>
                                <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4, ...fStyle }}>{t('کات','الوقت','Time',lang)}</label>
                                <input type="time" value={editForm.time} onChange={e => setEditForm(f => ({ ...f, time: e.target.value }))}
                                  style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid rgba(203,213,225,0.8)', fontSize: 13, background: '#fff', color: '#1e293b', outline: 'none' }} />
                              </div>
                            </div>
                            <div className="mb-3">
                              <label style={{ fontSize: 10, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', marginBottom: 4, ...fStyle }}>{t('ژمارەی میوان','عدد الضيوف','Guests',lang)}</label>
                              <input type="number" min="1" max="20" value={editForm.guest_count} onChange={e => setEditForm(f => ({ ...f, guest_count: e.target.value }))}
                                style={{ width: '100%', padding: '8px 10px', borderRadius: 10, border: '1.5px solid rgba(203,213,225,0.8)', fontSize: 13, background: '#fff', color: '#1e293b', outline: 'none' }} />
                            </div>
                            {editError && <p style={{ color: '#ef4444', fontSize: 12, marginBottom: 8, ...fStyle }}>{editError}</p>}
                            <button onClick={saveEdit} disabled={editSaving}
                              style={{ width: '100%', padding: '9px', borderRadius: 12, background: `linear-gradient(135deg, ${RED}, #990000)`, color: '#fff', fontWeight: 700, fontSize: 13, border: 'none', cursor: editSaving ? 'not-allowed' : 'pointer', opacity: editSaving ? 0.6 : 1, ...fStyle }}>
                              {editSaving ? t('پاشەکەوتکردن...','جارٍ الحفظ...','Saving...', lang) : t('پاشەکەوتکردن','حفظ التغييرات','Save Changes', lang)}
                            </button>
                          </div>
                        )}

                        {/* ── 4-Step Progress Stepper ── */}
                        <div style={{ ...glassCard, padding: '18px 20px 14px', marginBottom: 18, position: 'relative' }}>
                          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ position: 'absolute', top: 18, left: 32, right: 32, height: 2, background: 'rgba(203,213,225,0.85)', zIndex: 0 }} />
                            <div className="stepper-fill-breath" style={{
                              position: 'absolute', top: 18,
                              ...(isRtl ? { right: 32 } : { left: 32 }),
                              height: 3, borderRadius: 2, width: trackFill,
                              background: `linear-gradient(${isRtl ? 'to left' : 'to right'}, ${GOLD}, rgba(200,169,110,0.6))`,
                              transition: 'width 0.5s ease-in-out', zIndex: 1,
                            }} />
                            {TRACK_STEPS.map((step, idx) => {
                              const completed = step.num < trackStep
                              const active    = step.num === trackStep
                              const tNodeStyle = (completed || active) ? {
                                width: 36, height: 36, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: GOLD, border: `2px solid ${GOLD}`,
                                boxShadow: active ? '0 4px 16px rgba(200,169,110,0.5)' : '0 2px 8px rgba(200,169,110,0.3)',
                                transform: active ? 'scale(1.1)' : 'scale(1.05)',
                                outline: active ? '4px solid rgba(200,169,110,0.22)' : 'none',
                                outlineOffset: 2,
                                transition: 'all 0.3s ease-out',
                                position: 'relative', zIndex: 2,
                              } : {
                                width: 36, height: 36, borderRadius: '50%',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: `linear-gradient(135deg, ${RED}, #5a0000)`,
                                border: '2px solid rgba(200,169,110,0.25)',
                                boxShadow: '0 2px 10px rgba(122,0,0,0.25)',
                                color: '#fff',
                                transition: 'all 0.3s ease-out',
                                position: 'relative', zIndex: 2,
                              }
                              return (
                                <div key={step.num} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, position: 'relative', zIndex: 1 }}>
                                  <div style={tNodeStyle}>
                                    {completed
                                      ? <i className="ri-check-line" style={{ fontSize: 17, fontWeight: 'bold', color: '#fff' }} />
                                      : stepIcon(step.num, '#fff')}
                                  </div>
                                  <span style={{
                                    fontSize: 10,
                                    fontWeight: completed ? 700 : active ? 800 : 700,
                                    color: completed ? '#1e293b' : active ? RED : RED,
                                    textAlign: 'center', display: 'inline-block',
                                    transform: active ? 'scale(1.05)' : 'scale(1)',
                                    transition: 'all 0.3s ease-out',
                                    ...fStyle,
                                  }}>
                                    {t(TRACK_LABELS[idx].ku, TRACK_LABELS[idx].ar, TRACK_LABELS[idx].en, lang)}
                                  </span>
                                </div>
                              )
                            })}
                          </div>
                        </div>

                        {/* ── Status Badge ── */}
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 16 }}>
                          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 999, background: sc.bg, border: `1.5px solid ${sc.border}`, color: sc.text, fontSize: 12, fontWeight: 700, ...fStyle }}>
                            <span style={{ width: 7, height: 7, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                            {statusLabel}
                          </span>
                        </div>

                        {/* ── Detail Tiles ── */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 mt-5 mb-4">
                          {[
                            { label: t('کات','الوقت','Time',lang),                      icon: 'ri-time-line',            val: res.time?.slice(0,5)                          },
                            { label: t('بەروار','التاريخ','Date',lang),                  icon: 'ri-calendar-event-line',  val: res.date                                      },
                            { label: t('تۆمارکراوە','تاريخ التسجيل','Registered',lang), icon: 'ri-bookmark-3-line',      val: new Date(res.created_at).toLocaleDateString() },
                            { label: t('ژمارەی میوان','عدد الضيوف','Guests',lang),      icon: 'ri-group-line',           val: res.guest_count                               },
                          ].map(({ label, icon, val }) => (
                            <div key={label} style={{
                              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                              padding: '14px 16px', borderRadius: 16,
                              background: 'rgba(255,255,255,0.95)',
                              border: '1px solid rgba(200,169,110,0.18)',
                              boxShadow: '0 2px 10px rgba(122,0,0,0.06)',
                              transition: 'box-shadow 0.2s',
                            }}>
                              {/* badge + label */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                <div style={{
                                  width: 44, height: 44, borderRadius: 13, flexShrink: 0,
                                  background: `linear-gradient(145deg, ${RED}, #5a0000)`,
                                  boxShadow: `0 4px 14px rgba(122,0,0,0.35), 0 0 0 3px rgba(200,169,110,0.18)`,
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                  <i className={icon} style={{ fontSize: 20, color: GOLD }} />
                                </div>
                                <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', ...fStyle }}>{label}</span>
                              </div>
                              {/* value */}
                              <span style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', letterSpacing: '0', textAlign: 'left' }}>{val}</span>
                            </div>
                          ))}
                        </div>

                        {res.note && (
                          <p style={{ fontSize: 12, color: '#64748b', fontStyle: 'italic', paddingTop: 10, borderTop: '1px solid rgba(226,232,240,0.7)', marginBottom: 12, ...fStyle }}>{res.note}</p>
                        )}

                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          {/* ────────── BOOK TAB ────────── */}
          {pageTab === 'book' && (
            <div className="max-w-2xl mx-auto space-y-4">

              {/* Live Progress Stepper — persistent across all steps */}
              <LiveStepper />

              {/* Landing */}
              {!hasStartedProcess && (
                <div style={{ ...glassCard, position: 'relative', overflow: 'hidden', padding: '28px 24px 32px' }}>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

                  <div className="flex justify-center mb-5">
                    <div className="r-gold-pulse" style={{ width: 76, height: 76, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(200,169,110,0.06)', border: `1.5px solid rgba(200,169,110,0.32)` }}>
                      <FaceScanIcon size={44} color={GOLD} />
                    </div>
                  </div>

                  <h2 className="text-lg md:text-xl font-black text-slate-900 text-center mb-2" style={fStyle}>
                    {t('تۆمارکردنی سەردانکردن', 'تسجيل الزيارة', 'Visit Registration', lang)}
                  </h2>

                  <p className="text-center text-xs md:text-sm leading-relaxed mb-7 text-slate-500" style={fStyle}>
                    {t(
                      'بۆ تۆمارکردنی داواکارییەکەت، پێویستە سەرەتا وێنەی ڕوخسارت تۆمار بکەیت',
                      'لتسجيل طلبك، يجب أولاً التحقق من هويتك عبر الكاميرا.',
                      'To complete your reservation, we first need to verify your identity through a quick face scan.',
                      lang
                    )}
                  </p>

                  <button
                    type="button"
                    onClick={() => { setHasStartedProcess(true); setFaceScanOpen(true) }}
                    style={{
                      width: '100%', padding: '15px 24px', borderRadius: 18,
                      background: `linear-gradient(135deg, ${RED} 0%, #990000 100%)`,
                      border: '1px solid rgba(200,169,110,0.38)',
                      boxShadow: '0 8px 32px rgba(122,0,0,0.38), 0 1px 0 rgba(255,255,255,0.1) inset',
                      color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      transition: 'all 0.2s', ...fStyle,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.015)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(122,0,0,0.48)' }}
                    onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(122,0,0,0.38)' }}
                  >
                    <FaceScanIcon size={22} color={GOLD} />
                    {t('دەستپێکردن', 'بدء التسجيل ومسح الوجه', 'Start Registration & Face Scan', lang)}
                  </button>

                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 2, background: `linear-gradient(to right, transparent, rgba(200,169,110,0.18), transparent)` }} />
                </div>
              )}

              {/* Process */}
              {hasStartedProcess && (
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">

                {/* Face scan panel */}
                {!faceVerified && (
                  <div style={{ ...glassCard, overflow: 'hidden' }} className="r-reveal">
                    {/* Header bar */}
                    <div style={{
                      background: faceScanOpen ? 'rgba(245,158,11,0.05)' : 'rgba(200,169,110,0.03)',
                      borderBottom: '1px solid rgba(200,169,110,0.14)',
                      padding: '14px 20px',
                      display: 'flex', alignItems: 'center', gap: 12,
                      borderRadius: '24px 24px 0 0',
                      transition: 'background 0.3s',
                    }}>
                      <div style={{ width: 36, height: 36, borderRadius: 10, background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <FaceScanIcon size={18} color="#fbbf24" />
                      </div>
                      <div style={{ flex: 1 }} dir={isRtl ? 'rtl' : 'ltr'}>
                        <p className="text-slate-900 text-sm font-bold" style={fStyle}>
                          {t('فۆڕمی سەردانیکردن', 'محطة القياس الحيوي', 'Biometric Terminal', lang)}
                        </p>
                        <p style={{ fontSize: 12, color: faceScanOpen ? '#f59e0b' : '#94a3b8', marginTop: 1, transition: 'color 0.3s', ...fStyle }}>
                          {t('سەرەتا ڕووخسارت سکان بکە', 'في انتظار مسح الوجه', 'Awaiting face scan', lang)}
                        </p>
                      </div>
                      <span style={{ width: 10, height: 10, borderRadius: '50%', background: faceScanOpen ? '#f59e0b' : '#e2e8f0', flexShrink: 0, boxShadow: faceScanOpen ? '0 0 0 4px rgba(245,158,11,0.18)' : 'none', transition: 'all 0.3s' }} className={faceScanOpen ? 'animate-pulse' : ''} />
                    </div>

                    <div style={{ padding: '20px' }}>

                      {/* IDLE */}
                      {!faceScanOpen && !faceUploading && (
                        <button type="button" onClick={() => setFaceScanOpen(true)} style={{ width: '100%' }}>
                          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', paddingBottom: '62%', background: 'rgba(200,169,110,0.03)', border: '1.5px dashed rgba(200,169,110,0.35)', marginBottom: 12 }}>
                            {hudCorners()}
                            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
                              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <FaceScanIcon size={36} color="#fbbf24" />
                              </div>
                              <p style={{ color: '#475569', fontSize: 13, fontWeight: 600, ...fStyle }}>
                                {t('ڕووخسارت سکان بکە', 'امسح وجهك', 'Scan Your Face', lang)}
                              </p>
                            </div>
                          </div>
                          <div
                            style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.38)', borderRadius: 14, padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, transition: 'background 0.2s' }}
                            onMouseEnter={e => e.currentTarget.style.background = 'rgba(245,158,11,0.14)'}
                            onMouseLeave={e => e.currentTarget.style.background = 'rgba(245,158,11,0.08)'}
                          >
                            <i className="ri-camera-line text-amber-400" />
                            <span style={{ color: '#fbbf24', fontWeight: 700, fontSize: 13, ...fStyle }}>
                              {t('کردنەوەی کامێرا', 'فتح الكاميرا', 'Open Camera', lang)}
                            </span>
                          </div>
                        </button>
                      )}

                      {/* UPLOADING */}
                      {faceUploading && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '48px 0' }}>
                          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <span className="w-7 h-7 border-2 border-amber-200 border-t-amber-400 rounded-full animate-spin" />
                          </div>
                          <p style={{ color: '#f59e0b', fontSize: 13, fontWeight: 600, ...fStyle }}>
                            {t('ڕووخسار بارکراوە...', 'جاري رفع الوجه...', 'Uploading face…', lang)}
                          </p>
                        </div>
                      )}

                      {/* SCANNING */}
                      {faceScanOpen && !faceUploading && (
                        <div className="r-reveal">
                          <div className="flex justify-end mb-2">
                            <button type="button" onClick={() => setFaceScanOpen(false)}
                              style={{ width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
                              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.06)'; e.currentTarget.style.color = '#475569' }}
                              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8' }}
                            >
                              <i className="ri-close-line text-base" />
                            </button>
                          </div>

                          {/* HUD scanner frame */}
                          <div style={{ position: 'relative', borderRadius: 18, overflow: 'hidden', border: `1.5px solid rgba(200,169,110,0.5)`, boxShadow: `0 0 0 4px rgba(200,169,110,0.1)` }}>
                            <div className="r-scan-line" />
                            {/* HUD corners for live camera */}
                            <span style={{ position: 'absolute', top: 10, left: 10, width: 20, height: 20, borderLeft: `2px solid ${GOLD}`, borderTop: `2px solid ${GOLD}`, borderRadius: '3px 0 0 0', zIndex: 10 }} />
                            <span style={{ position: 'absolute', top: 10, right: 10, width: 20, height: 20, borderRight: `2px solid ${GOLD}`, borderTop: `2px solid ${GOLD}`, borderRadius: '0 3px 0 0', zIndex: 10 }} />
                            <span style={{ position: 'absolute', bottom: 10, left: 10, width: 20, height: 20, borderLeft: `2px solid ${GOLD}`, borderBottom: `2px solid ${GOLD}`, borderRadius: '0 0 0 3px', zIndex: 10 }} />
                            <span style={{ position: 'absolute', bottom: 10, right: 10, width: 20, height: 20, borderRight: `2px solid ${GOLD}`, borderBottom: `2px solid ${GOLD}`, borderRadius: '0 0 3px 0', zIndex: 10 }} />
                            <LiveCameraCapture compact lang={lang === 'ku' ? 'ku' : lang === 'ar' ? 'ar' : 'en'} onCapture={handleFaceCapture} />
                          </div>
                        </div>
                      )}

                    </div>
                  </div>
                )}

                {/* Verified banner */}
                {faceVerified && faceImageUrl && (
                  <div style={{ background: 'rgba(16,185,129,0.06)', border: '1.5px solid rgba(16,185,129,0.28)', borderRadius: 20, padding: 16, display: 'flex', alignItems: 'center', gap: 14 }} className="r-reveal">
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      <img src={faceImageUrl} alt="Face" style={{ width: 56, height: 56, borderRadius: 14, objectFit: 'cover', border: '1.5px solid rgba(16,185,129,0.5)' }} />
                      <div style={{ position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid #fff' }}>
                        <i className="ri-check-line text-white text-[9px]" />
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 700, fontSize: 13, color: '#059669', ...fStyle }}>
                        {t('ناسنامە پشکنراوە ✓', 'تم التحقق ✓', 'Identity Verified ✓', lang)}
                      </p>
                      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 2, ...fStyle }}>
                        {t('ئێستا زانیارییەکانت پڕبکەوە', 'الآن أكمل بياناتك', 'Now fill in your details below', lang)}
                      </p>
                    </div>
                    <button type="button"
                      onClick={() => { setFaceImageUrl(null); setFaceVerified(false); setFaceScanOpen(true) }}
                      style={{ color: '#94a3b8', background: 'transparent', border: 'none', cursor: 'pointer', padding: 4 }}>
                      <i className="ri-camera-line text-base" />
                    </button>
                  </div>
                )}

                {/* Form fields */}
                {faceVerified && (
                  <div style={{ ...glassCard, overflow: 'hidden' }} className="r-reveal">
                    <div style={{ height: 2, background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />
                    <div style={{ padding: '22px 22px 26px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                      {field('name', t('ناوی تەواو', 'الاسم الكامل', 'Full Name', lang), 'text',
                        { placeholder: t('ناوت بنووسە', 'أدخل اسمك', 'Enter your name', lang) })}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {field('guest_count', t('ژمارەی میوان', 'عدد الضيوف', 'Number of Guests', lang), 'number', { min: 1, max: 100, placeholder: '1' })}
                        {field('phone', t('ژمارەی تەلەفۆن', 'رقم الهاتف', 'Phone Number', lang), 'tel', { placeholder: '07XX XXX XXXX', dir: 'ltr' })}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {field('date', t('بەروار', 'التاريخ', 'Date', lang), 'date', { min: new Date().toISOString().split('T')[0] })}
                        {field('time', t('کات', 'الوقت', 'Time', lang), 'time')}
                      </div>
                      {field('note', t('تێبینی (ئارەزوو مەندانە)', 'ملاحظة (اختياري)', 'Note (optional)', lang), 'textarea',
                        { placeholder: t('هەر تێبینییەک...', 'أي ملاحظات...', 'Any notes...', lang) })}
                    </div>
                  </div>
                )}

                {/* Submit button */}
                {faceVerified && (
                  <button type="submit" disabled={loading || faceUploading} className="r-reveal"
                    style={{
                      width: '100%', padding: '15px 24px', borderRadius: 18,
                      background: `linear-gradient(135deg, ${RED} 0%, #990000 100%)`,
                      border: '1px solid rgba(200,169,110,0.35)',
                      boxShadow: '0 8px 32px rgba(122,0,0,0.4)',
                      color: '#fff', fontWeight: 800, fontSize: 15,
                      cursor: loading || faceUploading ? 'not-allowed' : 'pointer',
                      opacity: loading || faceUploading ? 0.6 : 1,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12,
                      transition: 'all 0.2s',
                      ...fStyle,
                    }}
                  >
                    {loading ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('ناردن...', 'جاري الإرسال...', 'Submitting...', lang)}</>
                    ) : faceUploading ? (
                      <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t('چاوەڕوانی بارکردنی ڕووخسار...', 'جاري رفع صورة الوجه...', 'Uploading face…', lang)}</>
                    ) : (
                      <>{t('تۆمارکردن و وەرگرتنی QR', 'تسجيل والحصول على QR', 'Submit & Get QR Code', lang)}
                      <i className="ri-qr-code-line text-lg" style={{ color: GOLD }} /></>
                    )}
                  </button>
                )}

              </div>
            </form>
              )}

            </div>
          )}

        </div>
      </div>
    </Wrapper>
  )
}
