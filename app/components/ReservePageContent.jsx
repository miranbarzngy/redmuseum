'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import QRCode from 'qrcode'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import { useMuseumName } from '../lib/useMuseumName'
import Sidebar from './Sidebar'

// Loaded only client-side — face detection pulls TensorFlow.js
const LiveCameraCapture = dynamic(() => import('./LiveCameraCapture'), { ssr: false })

const t = (ku, ar, en, lang) =>
  lang === 'ku' ? ku : lang === 'ar' ? ar : en

const fontStyle = (lang) =>
  lang === 'ku' ? 'UniSalar, Tahoma, sans-serif'
  : lang === 'ar' ? 'ArabicFont, Tahoma, sans-serif'
  : 'inherit'

const EMPTY = { name: '', guest_count: '', phone: '', date: '', time: '', note: '' }

const STATUS_COLOR = {
  pending:  { bg: 'bg-yellow-500/15', border: 'border-yellow-500/30', text: 'text-yellow-400', dot: 'bg-yellow-400' },
  approved: { bg: 'bg-blue-500/15',   border: 'border-blue-500/30',   text: 'text-blue-400',   dot: 'bg-blue-400'   },
  visited:  { bg: 'bg-green-500/15',  border: 'border-green-500/30',  text: 'text-green-400',  dot: 'bg-green-400'  },
}

const GOLD = '#c8a96e'
const RED  = '#7a0000'

export default function ReservePageContent({ initialLang = 'ku', inline = false }) {
  const [lang, setLang]               = useState(initialLang)
  const [pageTab, setPageTab]         = useState('book')
  const [form, setForm]               = useState(EMPTY)
  const [errors, setErrors]           = useState({})
  const [loading, setLoading]         = useState(false)
  const [reservation, setReservation] = useState(null)

  const [faceImageUrl, setFaceImageUrl]   = useState(null)
  const [faceVerified, setFaceVerified]   = useState(false)
  const [faceUploading, setFaceUploading] = useState(false)
  const [faceScanOpen, setFaceScanOpen]     = useState(false)
  const [hasStartedProcess, setHasStartedProcess] = useState(false)
  const [availableDays, setAvailableDays]   = useState(['1','2','3','4','5'])
  const [availableHours, setAvailableHours] = useState({ start: '09:00', end: '17:00' })
  const qrRef = useRef(null)
  const museumName = useMuseumName()

  const [trackPhone, setTrackPhone]     = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackResults, setTrackResults] = useState(null)
  const [trackError, setTrackError]     = useState('')
  const [bgColor, setBgColor]           = useState('#0a0a0a')

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

    // ── Details footer (mirrors success screen layout) ──────────
    ctx.fillStyle = '#111111'; ctx.fillRect(0, y, W, FOOTER_H)

    const drawFooterDivider = (dy) => {
      const gd = ctx.createLinearGradient(PAD, 0, W - PAD, 0)
      gd.addColorStop(0, 'transparent'); gd.addColorStop(0.5, 'rgba(255,255,255,0.08)'); gd.addColorStop(1, 'transparent')
      ctx.fillStyle = gd; ctx.fillRect(PAD, dy, W - PAD * 2, 1)
    }

    let fy = y + 20

    // Visitor name label
    ctx.fillStyle = '#4b5563'; ctx.font = '8px Arial'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText('VISITOR NAME', W / 2, fy); fy += 15

    // Visitor name value
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 17px ${kuFont}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'
    ctx.fillText(reservation.name, W / 2, fy); fy += 22

    drawFooterDivider(fy); fy += 14

    // Date / Time / Guests — 3-column row with vertical separators
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

    // Booking ID label
    ctx.fillStyle = '#4b5563'; ctx.font = '8px Arial'
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText('BOOKING ID', W / 2, fy); fy += 14

    // Booking ID badge
    const badgeW = 200, badgeH = 30, badgeX = (W - badgeW) / 2
    ctx.fillStyle = 'rgba(16,185,129,0.1)'
    ctx.beginPath(); ctx.roundRect(badgeX, fy, badgeW, badgeH, 8); ctx.fill()
    ctx.strokeStyle = 'rgba(16,185,129,0.3)'; ctx.lineWidth = 1
    ctx.beginPath(); ctx.roundRect(badgeX, fy, badgeW, badgeH, 8); ctx.stroke()
    ctx.fillStyle = '#34d399'; ctx.font = "bold 13px 'Courier New', monospace"
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText(resId, W / 2, fy + badgeH / 2)

    // ── Gold bottom bar ──
    const bg = ctx.createLinearGradient(0, 0, W, 0)
    bg.addColorStop(0, '#7a0000'); bg.addColorStop(0.5, '#c8a96e'); bg.addColorStop(1, '#7a0000')
    ctx.fillStyle = bg; ctx.fillRect(0, y + FOOTER_H, W, 5)

    const a = document.createElement('a')
    a.download = `reservation-qr-${reservation.id.slice(0, 8)}.png`
    a.href = canvas.toDataURL('image/png'); a.click()
  }

  const homeHref = lang === 'ar' ? '/arabic' : lang === 'ku' ? '/kurdish' : '/'

  const inputBase = {
    background: 'rgba(8,8,8,0.85)',
    border: '1px solid rgba(255,255,255,0.1)',
    borderRadius: 12,
    color: '#fff',
    width: '100%',
    padding: '10px 12px',
    outline: 'none',
    fontSize: 14,
    fontWeight: 500,
    transition: 'border-color 0.2s, box-shadow 0.2s',
    fontFamily: fontStyle(lang),
    colorScheme: 'dark',
  }

  const fieldsLocked = !faceVerified

  const field = (key, label, type = 'text', extra = {}) => {
    const disabledStyle = fieldsLocked ? {
      pointerEvents: 'none',
      userSelect: 'none',
    } : {}

    return (
      <div style={disabledStyle}>
        <label className="block text-xs md:text-sm font-semibold mb-1 md:mb-2"
          style={{ fontFamily: fontStyle(lang), color: fieldsLocked ? '#4b5563' : '#f5e6c8' }}>
          {label}
          {key !== 'note' && <span className="ml-1" style={{ color: fieldsLocked ? 'rgba(200,169,110,0.25)' : GOLD }}>*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            disabled={fieldsLocked}
            value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            rows={3}
            style={{
              ...inputBase,
              resize: 'none',
              borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,0.1)',
              cursor: fieldsLocked ? 'not-allowed' : 'text',
              opacity: fieldsLocked ? 0.5 : 1,
            }}
            onFocus={e  => { if (!errors[key] && !fieldsLocked) { e.target.style.borderColor = 'rgba(245,158,11,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' } }}
            onBlur={e   => { if (!errors[key]) { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' } }}
            {...extra}
          />
        ) : (
          <input
            disabled={fieldsLocked}
            type={type}
            value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            className={`date-input${(type === 'date' || type === 'time') ? ' picker-input' : ''}`}
            style={{
              ...inputBase,
              borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,0.1)',
              minHeight: (type === 'date' || type === 'time') ? 52 : 'auto',
              cursor: fieldsLocked ? 'not-allowed' : 'auto',
              opacity: fieldsLocked ? 0.5 : 1,
            }}
            onFocus={e  => { if (!errors[key] && !fieldsLocked) { e.target.style.borderColor = 'rgba(245,158,11,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' } }}
            onBlur={e   => { if (!errors[key]) { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' } }}
            {...extra}
          />
        )}
        {errors[key] && (
          <p className="text-red-400 text-xs mt-1.5" style={{ fontFamily: fontStyle(lang) }}>
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

  // ── Success screen ───────────────────────────────────────────
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
            <h1 className="text-2xl md:text-3xl font-black text-white text-center" style={{ fontFamily: fontStyle(lang) }}>
              {t('داواکارییەکەت تۆمارکرا!', 'تم تسجيل طلبك!', 'Reservation Submitted!', lang)}
            </h1>
            <span className="block flex-1 max-w-[60px] h-px rounded-full" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-white text-sm text-center leading-relaxed" style={{ fontFamily: fontStyle(lang) }}>
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
                <p className="text-gray-400 text-[10px] mt-3" style={{ fontFamily: fontStyle(lang) }}>
                  {t('ناسنامەی ڕووخسار', 'Face ID', 'Face ID', lang)}
                </p>
              </div>
            )}
          </div>

          <div className="px-5 pb-6 pt-5" style={{ background: '#111' }}>

            {/* Visitor name */}
            <div className="text-center mb-5">
              <p className="text-[9px] uppercase tracking-widest mb-2" style={{ color: '#4b5563', fontFamily: fontStyle(lang) }}>
                {t('ناوی سەردانکار', 'اسم الزائر', 'Visitor Name', lang)}
              </p>
              <p className="text-xl font-black text-white leading-tight" style={{ fontFamily: fontStyle(lang) }}>
                {reservation.name}
              </p>
            </div>

            {/* Divider */}
            <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />

            {/* Date · Time · Guests */}
            <div className="flex items-center justify-center gap-4 mb-5">
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', fontFamily: fontStyle(lang) }}>
                  {t('بەروار', 'التاريخ', 'Date', lang)}
                </p>
                <bdo dir="ltr" className="res-id block text-sm font-extrabold" style={{ color: '#fbbf24' }}>{reservation.date}</bdo>
              </div>
              <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', fontFamily: fontStyle(lang) }}>
                  {t('کات', 'الوقت', 'Time', lang)}
                </p>
                <bdo dir="ltr" className="res-id block text-sm font-extrabold" style={{ color: '#fbbf24' }}>{(reservation.time || '').slice(0, 5)}</bdo>
              </div>
              <div className="w-px h-8 shrink-0" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest mb-1.5" style={{ color: '#4b5563', fontFamily: fontStyle(lang) }}>
                  {t('میوان', 'الضيوف', 'Guests', lang)}
                </p>
                <bdo dir="ltr" className="res-id block text-sm font-extrabold text-white">{reservation.guest_count}</bdo>
              </div>
            </div>

            {/* Divider */}
            <div className="h-px mb-5" style={{ background: 'linear-gradient(to right, transparent, rgba(255,255,255,0.07), transparent)' }} />

            {/* Booking ID badge */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-[9px] uppercase tracking-widest" style={{ color: '#4b5563', fontFamily: fontStyle(lang) }}>
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
            className="w-full flex items-center justify-center gap-2 py-4 text-white text-base font-bold rounded-2xl transition-all"
            style={{ background: RED, border: `1px solid rgba(200,169,110,0.35)`, boxShadow: '0 4px 20px rgba(122,0,0,0.35)', fontFamily: fontStyle(lang) }}>
            <i className="ri-download-2-line text-lg" style={{ color: GOLD }} />
            {t('داونلۆدی QR','تحميل QR','Download QR',lang)}
          </button>
          <div className="flex gap-3">
            <button onClick={() => { setReservation(null); setForm(EMPTY); setFaceImageUrl(null); setFaceVerified(false); setFaceScanOpen(false); setHasStartedProcess(false) }}
              className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontStyle(lang) }}>
              <i className="ri-add-line" />
              {t('داواکارییەکی تر','حجز آخر','New Booking',lang)}
            </button>
            {!inline && (
              <Link href={homeHref}
                className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-2xl transition-all"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontStyle(lang) }}>
                <i className="ri-home-5-line" />
                {t('سەرەتا','الرئيسية','Home',lang)}
              </Link>
            )}
          </div>
        </div>

        <div className="h-px mt-10" style={{ background: `linear-gradient(to right, transparent, rgba(200,169,110,0.2), transparent)` }} />
      </div>
    )

    if (inline) return (
      <section id="reserve" className="text-white px-4 py-6 h-[calc(100dvh-4rem)] md:h-screen overflow-y-auto flex items-center justify-center" style={{ background: bgColor }} dir={isRtl ? 'rtl' : 'ltr'}>
        {successContent}
      </section>
    )
    return (
      <div className="min-h-screen text-white flex items-center justify-center px-4 py-16 md:pl-[88px]" style={{ background: bgColor }}>
        <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />
        {successContent}
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────
  const Wrapper = inline ? 'section' : 'div'

  // Dynamic terminal glow based on scan state
  const terminalStyle = faceVerified
    ? { background: 'rgba(6,6,6,0.92)', border: '1px solid rgba(16,185,129,0.4)', boxShadow: '0 0 30px rgba(16,185,129,0.15), 0 0 80px rgba(16,185,129,0.06)' }
    : faceScanOpen
    ? { background: 'rgba(6,6,6,0.92)', border: '1px solid rgba(245,158,11,0.4)', boxShadow: '0 0 24px rgba(245,158,11,0.12)' }
    : { background: 'rgba(6,6,6,0.92)', border: '1px solid rgba(255,255,255,0.08)' }

  return (
    <Wrapper
      id={inline ? 'reserve' : undefined}
      className={inline ? 'text-white px-4 md:px-8 py-5 md:py-10 h-[calc(100dvh-4rem)] md:h-screen overflow-hidden flex flex-col' : 'min-h-screen text-white px-4 py-5 md:py-16 md:pl-[88px]'}
      style={{ background: bgColor }}
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <style>{`
        .date-input { -webkit-appearance: none; appearance: none; }
        .date-input::-webkit-date-and-time-value { text-align: right; min-height: 1.5em; }
        .date-input::-webkit-inner-spin-button,
        .date-input::-webkit-clear-button { display: none; }
        .date-input::-webkit-calendar-picker-indicator {
          filter: brightness(0) invert(1);
          opacity: 0.7;
          cursor: pointer;
          margin-inline-start: 8px;
        }
        .date-input::-webkit-datetime-edit { padding: 0; }
        .date-input::-webkit-datetime-edit-fields-wrapper { padding: 0; }
        .date-input::placeholder { color: rgba(255,255,255,0.22); }
      `}</style>

      {!inline && <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />}

      <div className="w-full max-w-7xl mx-auto flex flex-col flex-1 min-h-0">

        {/* ── Header ─────────────────────────────────────────── */}
        <div className="text-center mb-4 md:mb-6 max-w-2xl mx-auto flex-shrink-0">
          {!inline && (
            <Link href={homeHref} className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-3 md:mb-8 transition-colors" style={{ fontFamily: fontStyle(lang) }}>
              <i className={`ri-arrow-${isRtl ? 'right' : 'left'}-line`} />
              {t('گەڕانەوە', 'رجوع', 'Back', lang)}
            </Link>
          )}

          <div className="flex items-center justify-center gap-3 md:gap-4 mb-2 md:mb-4">
            <span className="block w-10 md:w-16 h-1 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <h1 className="text-xl md:text-4xl font-black text-white" style={{ fontFamily: fontStyle(lang) }}>
              {t('داواکاری سەردانکردن', 'حجز زيارة', 'Reserve a Visit', lang)}
            </h1>
            <span className="block w-10 md:w-16 h-1 rounded-full" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <div className="flex items-center justify-center gap-2 mb-2 md:mb-4">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-gray-300 text-sm leading-relaxed" style={{ fontFamily: fontStyle(lang) }}>
            {t(
              'داواکاری پێشکەش بکە بۆ سەردانیکردنی مۆزەخانە',
              'أكمل النموذج وستحصل على رمز QR لمدخل المتحف',
              'Fill the form and receive a QR code for museum entry',
              lang
            )}
          </p>
        </div>

        {/* ── Tab switcher ───────────────────────────────────── */}
        <div className="max-w-2xl mx-auto mb-3 md:mb-6 flex-shrink-0">
          <div className="flex gap-1 p-1 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            {[
              { id: 'book',  ku: 'تۆمارکردن',            ar: 'حجز جديد',    en: 'New Booking'       },
              { id: 'track', ku: 'بەدواداچوونی داواکاری', ar: 'تتبع الحجز', en: 'Track Reservation' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setPageTab(tab.id); setTrackResults(null); setTrackError('')
                  if (!inline) window.history.replaceState({}, '', `?tab=${tab.id}`)
                }}
                className="flex-1 py-3 rounded-xl text-sm font-bold transition-all"
                style={{
                  fontFamily: fontStyle(lang),
                  color: '#fff',
                  background: pageTab === tab.id ? RED : 'transparent',
                  border: pageTab === tab.id ? `1px solid rgba(200,169,110,0.35)` : '1px solid transparent',
                  boxShadow: pageTab === tab.id ? '0 4px 16px rgba(122,0,0,0.4)' : 'none',
                }}
              >
                {t(tab.ku, tab.ar, tab.en, lang)}
              </button>
            ))}
          </div>
        </div>

        {/* Tab content — scrollable, fills remaining height */}
        <div className="flex-1 min-h-0 overflow-y-auto">

        {/* ── TRACK TAB ─────────────────────────────────────── */}
        {pageTab === 'track' && (
          <div className="max-w-2xl mx-auto space-y-5">
            <div className="rounded-2xl p-6 space-y-4 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,169,110,0.15)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />
              <p className="text-gray-400 text-sm" style={{ fontFamily: fontStyle(lang) }}>
                {t('ژمارەی تەلەفۆنەکەت بنووسە بۆ بینینی بارودۆخی داواکارییەکەت', 'أدخل رقم هاتفك لمعرفة حالة حجزك', 'Enter your phone number to check your reservation status', lang)}
              </p>
              <div className="flex gap-3">
                <input
                  type="tel"
                  value={trackPhone}
                  onChange={e => setTrackPhone(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && searchByPhone()}
                  placeholder="07XX XXX XXXX"
                  dir="ltr"
                  style={{ ...inputBase, flex: 1 }}
                  onFocus={e => { e.target.style.borderColor = 'rgba(245,158,11,0.7)'; e.target.style.boxShadow = '0 0 0 3px rgba(245,158,11,0.1)' }}
                  onBlur={e  => { e.target.style.borderColor = 'rgba(255,255,255,0.1)'; e.target.style.boxShadow = 'none' }}
                />
                <button
                  onClick={searchByPhone}
                  disabled={trackLoading || !trackPhone.trim()}
                  className="flex items-center gap-2 whitespace-nowrap px-5 py-3 text-white font-bold rounded-xl disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{ background: RED, border: `1px solid rgba(200,169,110,0.3)`, fontFamily: fontStyle(lang) }}
                >
                  {trackLoading
                    ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    : <i className="ri-search-line" />}
                  {t('گەڕان', 'بحث', 'Search', lang)}
                </button>
              </div>
            </div>

            {trackError && <p className="text-red-400 text-sm text-center" style={{ fontFamily: fontStyle(lang) }}>{trackError}</p>}

            {trackResults !== null && trackResults.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <i className="ri-inbox-line text-4xl mb-3 block" />
                <p style={{ fontFamily: fontStyle(lang) }}>{t('هیچ داواکارییەک نەدۆزرایەوە', 'لا توجد حجوزات بهذا الرقم', 'No reservations found for this number', lang)}</p>
              </div>
            )}

            {trackResults && trackResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider" style={{ fontFamily: fontStyle(lang) }}>
                  {trackResults.length} {t('داواکاری', 'حجز', 'reservation(s) found', lang)}
                </p>
                {trackResults.map(res => {
                  const sc = STATUS_COLOR[res.status] || STATUS_COLOR.pending
                  const statusLabel = { pending: t('چاوەڕوان بە','قيد الانتظار','Pending',lang), approved: t('پەسەندکراوە','مقبول','Approved',lang), visited: t('سەردانکرا','تمت الزيارة','Visited',lang) }[res.status] || res.status
                  return (
                    <div key={res.id} className={`rounded-2xl border p-5 ${sc.bg} ${sc.border}`}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div className="flex items-center gap-3">
                          {res.face_image_url && (
                            <div className="relative shrink-0">
                              <img
                                src={res.face_image_url}
                                alt="Face ID"
                                className="w-12 h-12 rounded-xl object-cover"
                                style={{ border: '1.5px solid rgba(16,185,129,0.5)' }}
                              />
                              <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                                style={{ border: '1.5px solid #000' }}>
                                <i className="ri-check-line text-white text-[8px]" />
                              </span>
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-white text-base" style={{ fontFamily: fontStyle(lang) }}>{res.name}</p>
                            <p className="text-xs text-gray-500 font-mono mt-0.5">#{res.id.slice(0,8).toUpperCase()}</p>
                          </div>
                        </div>
                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${sc.bg} ${sc.border} ${sc.text} whitespace-nowrap`} style={{ fontFamily: fontStyle(lang) }}>
                          <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />{statusLabel}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {[
                          [t('بەروار','التاريخ','Date',lang), res.date],
                          [t('کات','الوقت','Time',lang), res.time?.slice(0,5)],
                          [t('ژمارەی میوان','عدد الضيوف','Guests',lang), res.guest_count],
                          [t('تۆمارکراوە','تاريخ التسجيل','Booked on',lang), new Date(res.created_at).toLocaleDateString()],
                        ].map(([label, val]) => (
                          <div key={label} className="bg-black/20 rounded-xl px-3 py-2">
                            <p className="text-gray-500 text-xs mb-0.5" style={{ fontFamily: fontStyle(lang) }}>{label}</p>
                            <p className="text-white font-semibold">{val}</p>
                          </div>
                        ))}
                      </div>
                      {res.note && <p className="mt-3 text-xs text-gray-500 italic border-t border-white/5 pt-3" style={{ fontFamily: fontStyle(lang) }}>{res.note}</p>}
                      <Link
                        href={`/reservation/${res.id}`}
                        className="mt-3 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-bold text-white transition-all border-t border-white/5 pt-3"
                        style={{ fontFamily: fontStyle(lang), color: GOLD }}
                      >
                        <i className="ri-qr-code-line text-sm" />
                        {t('بینینی پاسی داواکاری', 'عرض تصريح الحجز', 'View Reservation Pass', lang)}
                      </Link>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ── BOOK TAB ──────────────────────────────────────── */}
        {pageTab === 'book' && !hasStartedProcess && (
          <div className="max-w-xl mx-auto">
            <div className="rounded-2xl p-4 md:p-8 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,169,110,0.2)' }}>
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

              {/* Icon */}
              <div className="flex justify-center mb-3 md:mb-6">
                <div className="w-14 h-14 md:w-20 md:h-20 rounded-full flex items-center justify-center"
                  style={{ background: 'rgba(200,169,110,0.06)', border: '1.5px solid rgba(200,169,110,0.3)' }}>
                  <i className="ri-scan-2-line text-4xl md:text-5xl" style={{ color: GOLD }} />
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg md:text-xl font-black text-white text-center mb-2 md:mb-3" style={{ fontFamily: fontStyle(lang) }}>
                {t('تۆمارکردنی سەردانکردن', 'تسجيل الزيارة', 'Visit Registration', lang)}
              </h2>

              {/* Description */}
              <p className="text-center text-xs md:text-sm leading-relaxed md:leading-loose mb-4 md:mb-8" style={{ color: '#9ca3af', fontFamily: fontStyle(lang) }}>
                {t(
                  'بۆ تۆمارکردنی داواکارییەکەت، پێویستە سەرەتا وێنەی ڕوخسارت تۆمار بکەیت',
                  'لتسجيل طلبك، يجب أولاً التحقق من هويتك عبر الكاميرا.',
                  'To complete your reservation, we first need to verify your identity through a quick face scan using your device camera.',
                  lang
                )}
              </p>

              {/* Steps */}
              <div className="flex items-start justify-center gap-0 mb-4 md:mb-8">
                {[
                  { n: '1', label: t('سکانی ڕووخسار', 'مسح الوجه', 'Face Scan', lang), active: true },
                  { n: '2', label: t('داواکاری',       'التسجيل',   'Booking',   lang), active: false },
                  { n: '3', label: t('وەرگرتنی کۆد',    'الحصول على QR', 'Get QR', lang), active: false },
                ].map((step, i) => (
                  <div key={i} className="flex items-center">
                    <div className="flex flex-col items-center gap-1.5 px-4">
                      <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black"
                        style={{
                          background: step.active ? GOLD : 'rgba(255,255,255,0.05)',
                          color: step.active ? '#000' : '#4b5563',
                          border: step.active ? 'none' : '1px solid rgba(255,255,255,0.08)',
                        }}>
                        {step.n}
                      </div>
                      <span className="text-[10px] font-medium whitespace-nowrap" style={{ color: step.active ? '#f5e6c8' : '#6b7280', fontFamily: fontStyle(lang) }}>
                        {step.label}
                      </span>
                    </div>
                    {i < 2 && <div className="w-6 h-px mb-4" style={{ background: 'rgba(255,255,255,0.08)' }} />}
                  </div>
                ))}
              </div>

              {/* Start button */}
              <button
                type="button"
                onClick={() => { setHasStartedProcess(true); setFaceScanOpen(true) }}
                className="w-full py-4 rounded-2xl font-black text-base transition-all hover:brightness-110 active:scale-[0.99]"
                style={{
                  background: `linear-gradient(135deg, ${RED}, rgba(122,0,0,0.85))`,
                  border: `1px solid rgba(200,169,110,0.4)`,
                  boxShadow: `0 8px 32px rgba(122,0,0,0.45)`,
                  color: '#fff',
                  fontFamily: fontStyle(lang),
                }}
              >
                <span className="flex items-center justify-center gap-3">
                  <i className="ri-scan-2-line text-xl" style={{ color: GOLD }} />
                  {t('دەستپێکردنی تۆمارکردن و سکانی ڕووخسار', 'بدء التسجيل ومسح الوجه', 'Start Registration & Face Scan', lang)}
                </span>
              </button>

              <div className="absolute bottom-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, rgba(200,169,110,0.2), transparent)` }} />
            </div>
          </div>
        )}

        {pageTab === 'book' && hasStartedProcess && (
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 max-w-5xl mx-auto w-full items-stretch">

              {/* ── LEFT: Biometric Terminal ─────────────────── */}
              <div>
                <div className="rounded-2xl overflow-hidden transition-all duration-500" style={terminalStyle}>

                  {/* Terminal header bar */}
                  <div className="px-5 py-4 flex items-center gap-3"
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(255,255,255,0.015)' }}>
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 transition-all duration-300"
                      style={faceVerified
                        ? { background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.4)' }
                        : { background: 'rgba(245,158,11,0.1)', border: '1px solid rgba(245,158,11,0.35)' }
                      }>
                      <i className={`text-base ${faceVerified ? 'ri-shield-check-fill text-emerald-400' : 'ri-scan-2-line text-amber-400'}`} />
                    </div>
                    <div className="flex-1 min-w-0" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                      <p className="text-white text-sm font-bold" style={{ fontFamily: fontStyle(lang) }}>
                        {t('فۆڕمی سەردانیکردن', 'محطة القياس الحيوي', 'Biometric Terminal', lang)}
                      </p>
                      <p className="text-xs mt-0.5 transition-colors duration-300"
                        style={{ color: faceVerified ? '#10b981' : '#6b7280', fontFamily: fontStyle(lang) }}>
                        {faceVerified
                          ? t('ناسنامە پشکنراوە ✓', 'تم التحقق ✓', 'Identity Verified ✓', lang)
                          : t('سەرەتا ڕووخسارت سکان بکە', 'في انتظار مسح الوجه', 'Awaiting face scan', lang)
                        }
                      </p>
                    </div>
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 transition-colors duration-300 ${
                      faceVerified ? 'bg-emerald-400' : faceScanOpen ? 'bg-amber-400 animate-pulse' : 'bg-neutral-600'
                    }`} />
                  </div>

                  {/* Camera / face area */}
                  <div className="p-5">

                    {/* IDLE — invite to scan */}
                    {!faceImageUrl && !faceScanOpen && !faceUploading && (
                      <button
                        type="button"
                        onClick={() => setFaceScanOpen(true)}
                        className="w-full group transition-all duration-300 transform hover:scale-[1.01] active:scale-[0.99]"
                      >
                        {/* Scan placeholder frame */}
                        <div className="relative rounded-2xl overflow-hidden mb-4"
                          style={{
                            background: 'rgba(245,158,11,0.025)',
                            border: '1.5px dashed rgba(245,158,11,0.35)',
                            paddingBottom: '75%',
                          }}>
                          {/* Corner brackets */}
                          <span className="absolute top-3 left-3 w-6 h-6 border-l-2 border-t-2" style={{ borderColor: 'rgba(245,158,11,0.55)' }} />
                          <span className="absolute top-3 right-3 w-6 h-6 border-r-2 border-t-2" style={{ borderColor: 'rgba(245,158,11,0.55)' }} />
                          <span className="absolute bottom-3 left-3 w-6 h-6 border-l-2 border-b-2" style={{ borderColor: 'rgba(245,158,11,0.55)' }} />
                          <span className="absolute bottom-3 right-3 w-6 h-6 border-r-2 border-b-2" style={{ borderColor: 'rgba(245,158,11,0.55)' }} />

                          {/* Center content */}
                          <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 px-6">
                            <div className="w-20 h-20 rounded-full flex items-center justify-center"
                              style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
                              <i className="ri-scan-2-line text-4xl text-amber-400" />
                            </div>
                            <div className="text-center">
                              <p className="text-white font-bold text-sm mb-1.5 leading-relaxed" style={{ fontFamily: fontStyle(lang) }}>
                                {t('ڕووخسارت سکان بکە', 'امسح وجهك', 'Scan Your Face', lang)}
                              </p>
                              <p className="text-xs leading-relaxed" style={{ color: '#9ca3af', fontFamily: fontStyle(lang) }}>
                                {t('بۆ چالاككردنی فۆڕمی تۆمارکردن', 'لتفعيل نموذج التسجيل', 'to unlock the registration form', lang)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* CTA button */}
                        <div className="flex items-center justify-center gap-2.5 py-3.5 rounded-xl transition-all duration-300 group-hover:brightness-110"
                          style={{
                            background: 'linear-gradient(135deg, rgba(245,158,11,0.18), rgba(245,158,11,0.08))',
                            border: '1px solid rgba(245,158,11,0.4)',
                            boxShadow: '0 0 20px rgba(245,158,11,0.08)',
                          }}>
                          <i className="ri-camera-line text-amber-400 text-base" />
                          <span className="text-sm font-bold" style={{ color: '#fbbf24', fontFamily: fontStyle(lang) }}>
                            {t('کردنەوەی کامێرا', 'فتح الكاميرا', 'Open Camera', lang)}
                          </span>
                          <i className={`ri-arrow-${isRtl ? 'left' : 'right'}-s-line text-amber-400/60 text-sm`} />
                        </div>
                      </button>
                    )}

                    {/* UPLOADING */}
                    {faceUploading && (
                      <div className="flex flex-col items-center justify-center gap-4 py-16">
                        <div className="w-16 h-16 rounded-full flex items-center justify-center"
                          style={{ background: 'rgba(245,158,11,0.08)', border: '1.5px solid rgba(245,158,11,0.3)' }}>
                          <span className="w-7 h-7 border-2 border-amber-500/20 border-t-amber-400 rounded-full animate-spin" />
                        </div>
                        <p className="text-amber-400 text-sm font-semibold" style={{ fontFamily: fontStyle(lang) }}>
                          {t('ڕووخسار بارکراوە...', 'جاري رفع الوجه...', 'Uploading face…', lang)}
                        </p>
                      </div>
                    )}

                    {/* SCANNER OPEN */}
                    {!faceImageUrl && faceScanOpen && !faceUploading && (
                      <div>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-white text-sm font-semibold" style={{ fontFamily: fontStyle(lang) }}>
                            {t('ڕوخسارت لە ناوەڕاستی کامێراکە جێگیر بکە', 'ضع وجهك في المنتصف', 'Center your face in the frame', lang)}
                          </p>
                          <button
                            type="button"
                            onClick={() => setFaceScanOpen(false)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-500 hover:text-white hover:bg-white/10 transition-all"
                          >
                            <i className="ri-close-line text-base" />
                          </button>
                        </div>
                        <LiveCameraCapture
                          compact
                          lang={lang === 'ku' ? 'ku' : lang === 'ar' ? 'ar' : 'en'}
                          onCapture={handleFaceCapture}
                        />
                      </div>
                    )}

                    {/* VERIFIED */}
                    {faceImageUrl && !faceUploading && (
                      <div className="flex flex-col items-center gap-5 py-2">
                        <div className="relative">
                          <div className="rounded-2xl overflow-hidden"
                            style={{
                              width: 176,
                              height: 220,
                              border: '2px solid rgba(16,185,129,0.5)',
                              boxShadow: '0 0 25px rgba(16,185,129,0.2), 0 8px 40px rgba(0,0,0,0.6)',
                            }}>
                            <img src={faceImageUrl} alt="Face ID" className="w-full h-full object-cover" />
                          </div>
                          <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold text-white whitespace-nowrap"
                            style={{ background: '#10b981', border: '2px solid rgba(0,0,0,0.8)', boxShadow: '0 2px 12px rgba(16,185,129,0.5)' }}>
                            <i className="ri-shield-check-fill text-xs" />
                            {t('ڕووخسار پشکنراوە', 'تم التحقق', 'Face Verified', lang)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => { setFaceImageUrl(null); setFaceVerified(false); setFaceScanOpen(true) }}
                          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5 mt-2"
                          style={{ color: '#9ca3af', fontFamily: fontStyle(lang) }}
                        >
                          <i className="ri-camera-line text-sm" />
                          {t('دووبارە سکان بکە', 'إعادة المسح', 'Retake Scan', lang)}
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── RIGHT: Form ──────────────────────────────── */}
              <div className="flex flex-col gap-4">

                {/* Form card */}
                <div className="relative rounded-2xl overflow-hidden"
                  style={{ background: 'rgba(8,8,8,0.8)', border: '1px solid rgba(200,169,110,0.12)' }}>
                  {/* Gold top accent */}
                  <div className="h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

                  <div className="p-4 md:p-6 space-y-3 md:space-y-5">
                    {field('name',
                      t('ناوی تەواو', 'الاسم الكامل', 'Full Name', lang),
                      'text',
                      { placeholder: t('ناوت بنووسە', 'أدخل اسمك', 'Enter your name', lang) }
                    )}

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {field('guest_count', t('ژمارەی میوان', 'عدد الضيوف', 'Number of Guests', lang), 'number', { min: 1, max: 100, placeholder: '1' })}
                      {field('phone', t('ژمارەی تەلەفۆن', 'رقم الهاتف', 'Phone Number', lang), 'tel', { placeholder: '07XX XXX XXXX', dir: 'ltr' })}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {field('date', t('بەروار', 'التاريخ', 'Date', lang), 'date', { min: new Date().toISOString().split('T')[0] })}
                      {field('time', t('کات', 'الوقت', 'Time', lang), 'time')}
                    </div>

                    {field('note',
                      t('تێبینی (ئارەزوو مەندانە)', 'ملاحظة (اختياري)', 'Note (optional)', lang),
                      'textarea',
                      { placeholder: t('هەر تێبینییەک...', 'أي ملاحظات...', 'Any notes...', lang) }
                    )}
                  </div>

                  {/* Frosted glass lock overlay */}
                  {fieldsLocked && (
                    <div
                      className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-5 cursor-pointer"
                      style={{
                        backdropFilter: 'blur(8px)',
                        WebkitBackdropFilter: 'blur(8px)',
                        background: 'rgba(0,0,0,0.58)',
                      }}
                      onClick={() => setFaceScanOpen(true)}
                    >
                      {/* Glowing lock icon */}
                      <div className="w-16 h-16 rounded-2xl flex items-center justify-center"
                        style={{
                          background: 'rgba(200,169,110,0.08)',
                          border: '1.5px solid rgba(200,169,110,0.45)',
                          boxShadow: '0 0 28px rgba(200,169,110,0.2), 0 0 70px rgba(200,169,110,0.08)',
                        }}>
                        <i className="ri-lock-line text-3xl" style={{ color: GOLD }} />
                      </div>
                      <div className="text-center px-8 max-w-xs">
                        <p className="text-white font-bold text-sm leading-loose mb-3" style={{ fontFamily: fontStyle(lang) }}>
                          {t(
                            'تکایە سەرەتا ڕووخسارت سکان بکە بۆ چالاككردنی فۆڕمەکە',
                            'يرجى مسح وجهك أولاً لتفعيل النموذج',
                            'Please scan your face first to unlock the form',
                            lang
                          )}
                        </p>
                        <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full"
                          style={{ color: GOLD, background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.28)' }}>
                          <i className="ri-camera-line text-xs" />
                          {t('کلیک بکە بۆ کردنەوەی کامێرا', 'انقر لفتح الكاميرا', 'Tap to open camera', lang)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={loading || fieldsLocked || faceUploading}
                  onClick={fieldsLocked ? (e) => { e.preventDefault(); setFaceScanOpen(true) } : undefined}
                  className="w-full py-3 md:py-4 text-white font-black text-base md:text-lg rounded-xl md:rounded-2xl disabled:cursor-not-allowed transition-all"
                  style={{
                    background: fieldsLocked ? 'rgba(122,0,0,0.35)' : RED,
                    border: `1px solid rgba(200,169,110,${fieldsLocked ? '0.15' : '0.35'})`,
                    boxShadow: fieldsLocked ? 'none' : '0 8px 32px rgba(122,0,0,0.4)',
                    opacity: loading ? 0.5 : fieldsLocked ? 0.45 : 1,
                    fontFamily: fontStyle(lang),
                  }}
                >
                  {loading
                    ? t('ناردن...', 'جاري الإرسال...', 'Submitting...', lang)
                    : faceUploading
                    ? <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin shrink-0" />
                        {t('چاوەڕوانی بارکردنی ڕووخسار...', 'جاري رفع صورة الوجه...', 'Uploading face…', lang)}
                      </span>
                    : fieldsLocked
                    ? <span className="flex items-center justify-center gap-2">
                        <i className="ri-lock-line" />
                        {t('سەرەتا ڕووخسارت سکان بکە', 'امسح وجهك أولاً', 'Scan face first', lang)}
                      </span>
                    : t('تۆمارکردن و وەرگرتنی QR', 'تسجيل والحصول على QR', 'Submit & Get QR Code', lang)
                  }
                </button>
              </div>

            </div>
          </form>
        )}

        </div>
      </div>
    </Wrapper>
  )
}
