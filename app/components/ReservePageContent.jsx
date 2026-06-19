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
  : lang === 'ar' ? 'Cairo, Tahoma, sans-serif'
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

  const [faceImageUrl, setFaceImageUrl]   = useState(null)   // Supabase URL for admin review
  const [faceVerified, setFaceVerified]   = useState(false)  // unlocks the form after capture
  const [faceUploading, setFaceUploading] = useState(false)
  const [faceScanOpen, setFaceScanOpen]   = useState(false)
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

  // Upload captured face data URL → Supabase storage
  // Resize & compress a face dataUrl to at most maxPx on the longest side at JPEG quality 0-1
  const compressFace = (dataUrl, maxPx = 480, quality = 0.78) =>
    new Promise(resolve => {
      const img = new Image()
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height))
        const w = Math.round(img.width * scale)
        const h = Math.round(img.height * scale)
        const c = document.createElement('canvas')
        c.width = w; c.height = h
        c.getContext('2d').drawImage(img, 0, 0, w, h)
        resolve(c.toDataURL('image/jpeg', quality))
      }
      img.onerror = () => resolve(dataUrl)   // fallback: use original
      img.src = dataUrl
    })

  const handleFaceCapture = async (dataUrl) => {
    // Unlock the form immediately — upload is for admin review only
    setFaceVerified(true)
    setFaceScanOpen(false)
    setFaceImageUrl(dataUrl)   // show local preview while uploading
    setFaceUploading(true)
    try {
      // Compress to ≤480px / 78% JPEG before upload (~40-80 KB vs raw 1-5 MB)
      const compressed = await compressFace(dataUrl, 480, 0.78)
      const res  = await fetch(compressed)
      const blob = await res.blob()
      const fd   = new FormData()
      fd.append('face', blob, 'face.jpg')
      const r    = await fetch('/api/reserve/upload-face', { method: 'POST', body: fd })
      const json = await r.json()
      if (r.ok && json.url) {
        setFaceImageUrl(json.url)   // replace local preview with Supabase URL
      } else {
        console.warn('[face-upload] API error:', json?.error)
      }
    } catch (err) {
      console.warn('[face-upload] failed:', err?.message || err)
      // Form stays unlocked with local preview; face won't be saved to DB
    } finally {
      setFaceUploading(false)
    }
  }

  useEffect(() => { const saved = localStorage.getItem('museum-lang'); if (saved) setLang(saved) }, [])

  // Sync tab with URL ?tab=track on mount
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
    // Fetch museum name from settings
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

    // Load UniSalar font
    let uniSalarLoaded = false
    try {
      const ff = new FontFace('UniSalar', 'url(/fonts/UniSalar.otf)')
      await ff.load(); document.fonts.add(ff); uniSalarLoaded = true
    } catch {}
    const kuFont = uniSalarLoaded ? 'UniSalar, Tahoma, sans-serif' : 'Tahoma, sans-serif'

    // Load museum icon
    const logoImg = await new Promise(resolve => {
      const img = new Image(); img.onload = () => resolve(img); img.onerror = () => resolve(null)
      img.src = '/android-chrome-192x192.png'
    })

    // Load face image if available
    const faceImg = faceImageUrl ? await new Promise(resolve => {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => resolve(img)
      img.onerror = () => resolve(null)
      img.src = faceImageUrl
    }) : null

    // Helper: draw image with object-cover (center-crop to fill box)
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

    // Generate QR as image
    const hasFace = !!faceImg
    const qrUrl = `${window.location.origin}/reservation/${reservation.id}`
    const qrPixels = hasFace ? 320 : 464
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: qrPixels, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0a0a0a', light: '#ffffff' } })
    const qrImg = await new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.src = qrDataUrl })

    // ── Canvas layout constants ──
    const W = 520, LOGO_H = 80, GOLD_H = 3, TITLE_H = 56, PAD = 24
    const FOOTER_H = 96

    // QR + face row
    // Face panel: 160px wide, same height as QR, face image is square (1:1 crop)
    const QR_SIZE  = hasFace ? 264 : W - PAD * 2
    const FACE_W   = hasFace ? 176 : 0
    const FACE_GAP = hasFace ? 16  : 0
    const ROW_PAD  = 24
    const ROW_H    = QR_SIZE + ROW_PAD * 2

    const H = LOGO_H + GOLD_H + TITLE_H + GOLD_H + ROW_H + FOOTER_H + 5

    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')

    // White base
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

    // ── Logo banner (dark red) ──
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

    // ── Gold separator ──
    let y = LOGO_H
    const drawGold = () => {
      const g = ctx.createLinearGradient(0, 0, W, 0)
      g.addColorStop(0, 'transparent'); g.addColorStop(0.5, '#c8a96e'); g.addColorStop(1, 'transparent')
      ctx.fillStyle = g; ctx.fillRect(0, y, W, GOLD_H); y += GOLD_H
    }
    drawGold()

    // ── Reservation ID bar ──
    ctx.fillStyle = '#7a0000'; ctx.fillRect(0, y, W, TITLE_H)
    const resId = '#' + reservation.id.slice(0, 8).toUpperCase()
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 20px 'Courier New', Courier, monospace`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText(resId, W / 2, y + TITLE_H / 2)
    y += TITLE_H

    drawGold()

    // ── Dark row: QR + face ──
    ctx.fillStyle = '#111111'; ctx.fillRect(0, y, W, ROW_H)

    if (hasFace) {
      const groupW = QR_SIZE + FACE_GAP + FACE_W
      const groupX = (W - groupW) / 2
      const itemY  = y + ROW_PAD

      // ── QR block (white rounded card) ──
      ctx.fillStyle = '#ffffff'
      ctx.beginPath(); ctx.roundRect(groupX, itemY, QR_SIZE, QR_SIZE, 10); ctx.fill()
      // slight inset so QR doesn't bleed to edges
      ctx.drawImage(qrImg, groupX + 8, itemY + 8, QR_SIZE - 16, QR_SIZE - 16)

      // ── Face panel ──
      const faceX   = groupX + QR_SIZE + FACE_GAP
      const IP      = 6     // inner padding around face image
      // Face image occupies top portion, badge sits below
      const BADGE_H = 28
      const LABEL_H = 18    // "Face ID" label line
      const IMG_W   = FACE_W - IP * 2
      // Keep face image at 4:5 portrait ratio (good for close-up selfie)
      const IMG_H   = Math.round(IMG_W * 1.25)
      const PANEL_H = IP + IMG_H + 6 + BADGE_H + 4 + LABEL_H + IP
      // Vertically centre the panel within QR_SIZE
      const panelY  = itemY + Math.max(0, (QR_SIZE - PANEL_H) / 2)

      // Panel background
      ctx.fillStyle = '#1a1a1a'
      ctx.beginPath(); ctx.roundRect(faceX, panelY, FACE_W, PANEL_H, 12); ctx.fill()
      ctx.strokeStyle = 'rgba(16,185,129,0.6)'; ctx.lineWidth = 1.5
      ctx.beginPath(); ctx.roundRect(faceX, panelY, FACE_W, PANEL_H, 12); ctx.stroke()

      // Face image with object-cover center crop + rounded clip
      ctx.save()
      ctx.beginPath(); ctx.roundRect(faceX + IP, panelY + IP, IMG_W, IMG_H, 8); ctx.clip()
      drawCover(ctx, faceImg, faceX + IP, panelY + IP, IMG_W, IMG_H)
      ctx.restore()

      // Emerald verified badge
      const badgeY = panelY + IP + IMG_H + 6
      ctx.fillStyle = '#10b981'
      ctx.beginPath(); ctx.roundRect(faceX + IP, badgeY, IMG_W, BADGE_H, 7); ctx.fill()
      ctx.fillStyle = '#ffffff'; ctx.font = 'bold 11px Arial'
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
      ctx.fillText('✓  Face Verified', faceX + FACE_W / 2, badgeY + BADGE_H / 2)

      // "Face ID" sub-label
      const labelY = badgeY + BADGE_H + 4
      ctx.fillStyle = '#6b7280'; ctx.font = '9px Arial'
      ctx.fillText('Face ID', faceX + FACE_W / 2, labelY + LABEL_H / 2)
    } else {
      // No face — QR full width centred
      const qx = (W - QR_SIZE) / 2
      ctx.fillStyle = '#ffffff'; ctx.fillRect(qx, y + ROW_PAD, QR_SIZE, QR_SIZE)
      ctx.drawImage(qrImg, qx, y + ROW_PAD, QR_SIZE, QR_SIZE)
    }

    y += ROW_H

    // ── Footer ──
    ctx.fillStyle = '#111111'; ctx.fillRect(0, y, W, FOOTER_H)
    const fMid = y + FOOTER_H / 2
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 15px ${kuFont}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'
    ctx.fillText(reservation.name, W / 2, fMid - 18)
    ctx.direction = 'ltr'; ctx.font = '12px Arial, sans-serif'; ctx.fillStyle = '#9ca3af'
    ctx.fillText(`${reservation.date}  ·  ${(reservation.time || '').slice(0, 5)}  ·  ${reservation.guest_count} guests`, W / 2, fMid + 4)
    const ag = ctx.createLinearGradient(0, 0, W, 0)
    ag.addColorStop(0, 'transparent'); ag.addColorStop(0.5, '#c8a96e'); ag.addColorStop(1, 'transparent')
    ctx.fillStyle = ag; ctx.fillRect(0, y + FOOTER_H - 24, W, 1)
    ctx.fillStyle = '#6b7280'; ctx.font = '10px Arial'; ctx.textAlign = 'center'
    ctx.fillText(museumNameEn, W / 2, y + FOOTER_H - 10)

    // ── Gold bottom bar ──
    const bg = ctx.createLinearGradient(0, 0, W, 0)
    bg.addColorStop(0, '#7a0000'); bg.addColorStop(0.5, '#c8a96e'); bg.addColorStop(1, '#7a0000')
    ctx.fillStyle = bg; ctx.fillRect(0, y + FOOTER_H, W, 5)

    // Download
    const a = document.createElement('a')
    a.download = `reservation-qr-${reservation.id.slice(0, 8)}.png`
    a.href = canvas.toDataURL('image/png'); a.click()
  }

  const homeHref = lang === 'ar' ? '/arabic' : lang === 'ku' ? '/kurdish' : '/'

  const inputBase = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 12,
    color: '#fff',
    width: '100%',
    padding: '14px 16px',
    outline: 'none',
    fontSize: 14,
    transition: 'border-color 0.2s',
    fontFamily: fontStyle(lang),
    colorScheme: 'dark',
  }

  const fieldsLocked = !faceVerified

  const field = (key, label, type = 'text', extra = {}) => {
    const disabledStyle = fieldsLocked ? {
      opacity: 0.38,
      cursor: 'not-allowed',
      pointerEvents: 'none',
      userSelect: 'none',
    } : {}

    return (
      <div style={{ transition: 'opacity 0.35s', ...disabledStyle }}>
        <label className="block text-sm font-semibold mb-2" style={{ fontFamily: fontStyle(lang), color: fieldsLocked ? '#6b7280' : '#fff' }}>
          {label}
          {key !== 'note' && <span className="ml-1" style={{ color: fieldsLocked ? 'rgba(200,169,110,0.4)' : GOLD }}>*</span>}
        </label>
        {type === 'textarea' ? (
          <textarea
            disabled={fieldsLocked}
            value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            rows={3}
            style={{ ...inputBase, resize: 'none', borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,0.12)', cursor: fieldsLocked ? 'not-allowed' : 'text' }}
            onFocus={e  => { if (!errors[key] && !fieldsLocked) e.target.style.borderColor = GOLD }}
            onBlur={e   => { if (!errors[key]) e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
            {...extra}
          />
        ) : (
          <input
            disabled={fieldsLocked}
            type={type}
            value={form[key]}
            onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
            className={`date-input${(type === 'date' || type === 'time') ? ' picker-input' : ''}`}
            style={{ ...inputBase, borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,0.12)', minHeight: (type === 'date' || type === 'time') ? 52 : 'auto', cursor: fieldsLocked ? 'not-allowed' : 'auto' }}
            onFocus={e  => { if (!errors[key] && !fieldsLocked) e.target.style.borderColor = GOLD }}
            onBlur={e   => { if (!errors[key]) e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
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

        {/* Top gold accent */}
        <div className="h-px mb-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

        {/* Success icon */}
        <div className="flex flex-col items-center mb-8">
          <div className="relative mb-6">
            {/* Outer gold ring */}
            <div className="w-28 h-28 rounded-full flex items-center justify-center"
              style={{ border: `1px solid rgba(200,169,110,0.25)`, background: 'rgba(200,169,110,0.04)' }}>
              {/* Inner green ring */}
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(34,197,94,0.12)', border: '1.5px solid rgba(34,197,94,0.4)' }}>
                <i className="ri-checkbox-circle-fill text-green-400 text-4xl" />
              </div>
            </div>
            {/* Decorative dots */}
            <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ background: GOLD, opacity: 0.6 }} />
            <div className="absolute bottom-1 left-1 w-1.5 h-1.5 rounded-full" style={{ background: GOLD, opacity: 0.4 }} />
          </div>

          {/* Title with decorative lines */}
          <div className="flex items-center justify-center gap-4 mb-3 w-full">
            <span className="block flex-1 max-w-[60px] h-px rounded-full" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <h1 className="text-2xl md:text-3xl font-black text-white text-center" style={{ fontFamily: fontStyle(lang) }}>
              {t('داواکارییەکەت تۆمارکرا!', 'تم تسجيل طلبك!', 'Reservation Submitted!', lang)}
            </h1>
            <span className="block flex-1 max-w-[60px] h-px rounded-full" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          {/* Gold diamond divider */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-white text-sm text-center leading-relaxed" style={{ fontFamily: fontStyle(lang) }}>
            {t('تکایە وێنەیەک لەم زانیارییانەی خوارەوە لای خۆت دابگرە ، بۆ ئاگاداربوون لە ڕەوشی داواکارییەکت', 'يرجى إظهار رمز QR هذا عند مدخل المتحف للتحقق', 'Please show this QR code at the museum entrance for verification', lang)}
          </p>
        </div>

        {/* QR card */}
        <div className="rounded-2xl overflow-hidden mb-6" style={{ boxShadow: '0 16px 60px rgba(0,0,0,0.7)', border: `1px solid rgba(200,169,110,0.25)` }}>

          {/* ── Museum banner (matches download image) ── */}
          <div className="flex items-center justify-between px-5 py-0" style={{ background: '#6b0000', minHeight: 72 }}>
            {/* Text block */}
            <div className="flex flex-col" style={{ direction: 'rtl' }}>
              <span className="font-bold text-white text-sm leading-tight" style={{ fontFamily: 'UniSalar, Tahoma, sans-serif' }}>
                {museumName.kr}
              </span>
              <span className="text-gray-400 text-[10px] mt-0.5">{museumName.en}</span>
            </div>
            {/* Logo icon */}
            <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 ms-3"
              style={{ background: '#fff', padding: 3, border: '1.5px solid rgba(255,255,255,0.3)' }}>
              <img src="/android-chrome-192x192.png" alt="logo" className="w-full h-full object-cover rounded-lg" />
            </div>
          </div>

          {/* Gold separator */}
          <div className="h-[3px]" style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

          {/* Reservation ID bar */}
          <div className="flex items-center justify-center py-3.5" style={{ background: RED }}>
            <bdo dir="ltr" className="res-id text-white font-bold text-lg tracking-widest">{resId}</bdo>
          </div>

          {/* Gold separator */}
          <div className="h-[3px]" style={{ background: 'linear-gradient(to right, transparent, #c8a96e, transparent)' }} />

          {/* QR + Face side by side */}
          <div className="flex items-center justify-center gap-4 px-6 py-6" ref={qrRef} style={{ background: '#111' }}>
            {/* QR code */}
            <div className="rounded-2xl p-4 shadow-2xl shrink-0" style={{ background: '#fff', border: `1.5px solid rgba(200,169,110,0.35)` }}>
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}`} size={faceImageUrl ? 150 : 190} bgColor="#ffffff" fgColor="#0a0a0a" level="H" />
            </div>

            {/* Face capture — shown only when available */}
            {faceImageUrl && (
              <div className="flex flex-col items-center gap-2 shrink-0">
                <div className="relative">
                  <img
                    src={faceImageUrl}
                    alt="Face ID"
                    className="rounded-2xl object-cover shadow-2xl"
                    style={{ width: 110, height: 138, border: '1.5px solid rgba(16,185,129,0.5)' }}
                  />
                  {/* Emerald verified badge */}
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

          {/* Details */}
          <div className="px-5 pb-5 pt-1" style={{ background: '#111' }} dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="grid grid-cols-2 gap-2.5">
              {[
                { icon: 'ri-user-line',     label: t('ناو','الاسم','Name',lang),    val: reservation.name,                     span: true, numeric: false },
                { icon: 'ri-calendar-line', label: t('بەروار','التاريخ','Date',lang), val: reservation.date,                                numeric: true  },
                { icon: 'ri-time-line',     label: t('کات','الوقت','Time',lang),     val: (reservation.time || '').slice(0, 5),            numeric: true  },
                { icon: 'ri-group-line',    label: t('میوان','الضيوف','Guests',lang), val: reservation.guest_count,                         numeric: true  },
              ].map(({ icon, label, val, span, numeric }) => (
                <div key={label}
                  className={`rounded-xl px-3 py-2.5 ${span ? 'col-span-2' : ''}`}
                  style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <i className={`${icon} text-[10px]`} style={{ color: GOLD }} />
                    <span className="text-[10px] text-gray-300 uppercase tracking-wider" style={{ fontFamily: fontStyle(lang) }}>{label}</span>
                  </div>
                  {numeric
                    ? <bdo dir="ltr" className="res-id text-white font-bold text-sm block">{val}</bdo>
                    : <p className="text-white font-bold text-sm" style={{ fontFamily: fontStyle(lang) }}>{val}</p>
                  }
                </div>
              ))}
            </div>

            {/* Reservation ID row */}
            <div className="mt-2.5 flex items-center justify-between px-3 py-2.5 rounded-xl"
              style={{ background: 'rgba(200,169,110,0.06)', border: '1px solid rgba(200,169,110,0.15)' }}>
              <span className="text-[10px] text-gray-300 uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: fontStyle(lang) }}>
                <i className="ri-fingerprint-line text-[10px]" style={{ color: GOLD }} />
                {t('ناسنامەی داواکاری','معرف الحجز','Reservation ID',lang)}
              </span>
              <bdo dir="ltr" className="res-id text-sm font-bold" style={{ color: GOLD }}>{resId}</bdo>
            </div>
          </div>

          {/* Gold bottom bar */}
          <div className="h-[5px]" style={{ background: 'linear-gradient(to right, #7a0000, #c8a96e, #7a0000)' }} />
        </div>

        {/* Actions — QR full-width on top, secondary pair below */}
        <div className="flex flex-col gap-3">
          {/* Row 1: Download QR — full width on all sizes */}
          <button onClick={downloadQR}
            className="w-full flex items-center justify-center gap-2 py-4 text-white text-base font-bold rounded-2xl transition-all"
            style={{ background: RED, border: `1px solid rgba(200,169,110,0.35)`, boxShadow: '0 4px 20px rgba(122,0,0,0.35)', fontFamily: fontStyle(lang) }}>
            <i className="ri-download-2-line text-lg" style={{ color: GOLD }} />
            {t('داونلۆدی QR','تحميل QR','Download QR',lang)}
          </button>
          {/* Row 2: New Booking + Home side by side */}
          <div className="flex gap-3">
            <button onClick={() => { setReservation(null); setForm(EMPTY); setFaceImageUrl(null); setFaceVerified(false); setFaceScanOpen(false) }}
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

        {/* Bottom gold accent */}
        <div className="h-px mt-10" style={{ background: `linear-gradient(to right, transparent, rgba(200,169,110,0.2), transparent)` }} />

      </div>
    )

    if (inline) return (
      <section id="reserve" className="text-white px-4 py-16" style={{ background: bgColor }} dir={isRtl ? 'rtl' : 'ltr'}>
        {successContent}
      </section>
    )
    return (
      <div className="min-h-screen text-white flex items-center justify-center px-4 py-16" style={{ background: bgColor }}>
        <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />
        {successContent}
      </div>
    )
  }

  // ── Main form ────────────────────────────────────────────────
  const Wrapper = inline ? 'section' : 'div'
  return (
    <Wrapper
      id={inline ? 'reserve' : undefined}
      className={inline ? 'text-white px-4 md:px-8 py-16' : 'min-h-screen text-white px-4 py-16'}
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
        .date-input::placeholder { color: rgba(255,255,255,0.3); }
      `}</style>

      {!inline && <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />}

      <div className="max-w-xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          {!inline && (
            <Link href={homeHref} className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors" style={{ fontFamily: fontStyle(lang) }}>
              <i className={`ri-arrow-${isRtl ? 'right' : 'left'}-line`} />
              {t('گەڕانەوە', 'رجوع', 'Back', lang)}
            </Link>
          )}

          {/* Decorative lines + title */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="block w-16 h-1 rounded-full" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <h1 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: fontStyle(lang) }}>
              {t('داواکاری سەردانکردن', 'حجز زيارة', 'Reserve a Visit', lang)}
            </h1>
            <span className="block w-16 h-1 rounded-full" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          {/* Diamond divider */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-white text-sm leading-relaxed" style={{ fontFamily: fontStyle(lang) }}>
            {t(
              'داواکاری پێشکەش بکە بۆ سەردانیکردنی مۆزەخانە',
              'أكمل النموذج وستحصل على رمز QR لمدخل المتحف',
              'Fill the form and receive a QR code for museum entry',
              lang
            )}
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 p-1 rounded-2xl mb-6"
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

        {/* ── TRACK TAB ── */}
        {pageTab === 'track' && (
          <div className="space-y-5">
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
                  onFocus={e => e.target.style.borderColor = GOLD}
                  onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
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
                          {/* Face thumbnail */}
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
                      {/* View full pass link */}
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

        {/* ── BOOK TAB ── */}
        {pageTab === 'book' && (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Form card */}
            <div className="rounded-2xl overflow-hidden relative"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,169,110,0.15)' }}>
              {/* Gold top accent */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

              {/* ── Face ID Widget ────────────────────────────────── */}
              <div style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>

                {/* IDLE — click to scan */}
                {!faceImageUrl && !faceScanOpen && !faceUploading && (
                  <button
                    type="button"
                    onClick={() => setFaceScanOpen(true)}
                    className="w-full flex items-center gap-3 px-5 py-4 group transition-all hover:bg-white/[0.03]"
                  >
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all group-hover:scale-105"
                      style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)' }}>
                      <i className="ri-scan-2-line text-lg" style={{ color: GOLD }} />
                    </div>
                    <div className="flex-1 text-start" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                      <p className="text-white text-sm font-semibold" style={{ fontFamily: fontStyle(lang) }}>
                        {t('پشکنینی ناسنامەی ڕووخسار', 'التحقق من هوية الوجه', 'Face ID Verification', lang)}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: fontStyle(lang) }}>
                        {t('کلیک بکە بۆ سکانکردنی ڕووخسار', 'انقر لمسح وجهك', 'Click to scan your face', lang)}
                      </p>
                    </div>
                    <i className={`ri-arrow-${isRtl ? 'left' : 'right'}-s-line text-gray-500 text-lg group-hover:text-gray-400 transition-colors`} />
                  </button>
                )}

                {/* UPLOADING */}
                {faceUploading && (
                  <div className="flex items-center gap-3 px-5 py-4">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(200,169,110,0.1)', border: '1px solid rgba(200,169,110,0.3)' }}>
                      <span className="w-5 h-5 border-2 border-white/20 border-t-white/70 rounded-full animate-spin" />
                    </div>
                    <p className="text-gray-400 text-sm" style={{ fontFamily: fontStyle(lang) }}>
                      {t('ڕووخسار بارکراوە...', 'جاري رفع الوجه...', 'Uploading face…', lang)}
                    </p>
                  </div>
                )}

                {/* SCANNER OPEN */}
                {!faceImageUrl && faceScanOpen && !faceUploading && (
                  <div className="px-5 pt-4 pb-5">
                    {/* Scanner header */}
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-white text-sm font-semibold" style={{ fontFamily: fontStyle(lang) }}>
                        {t('ڕووخسارت لە ناوەڕاست بگرە', 'ضع وجهك في المنتصف', 'Center your face in the frame', lang)}
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
                      onSkip={() => setFaceScanOpen(false)}
                    />
                  </div>
                )}

                {/* VERIFIED */}
                {faceImageUrl && !faceUploading && (
                  <div className="flex items-center gap-3 px-5 py-3.5">
                    <div className="relative shrink-0">
                      <img src={faceImageUrl} alt="" className="w-10 h-10 rounded-full object-cover"
                        style={{ border: '2px solid rgba(16,185,129,0.6)' }} />
                      <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center"
                        style={{ border: '1.5px solid #000' }}>
                        <i className="ri-check-line text-white text-[9px]" />
                      </span>
                    </div>
                    <div className="flex-1" style={{ direction: isRtl ? 'rtl' : 'ltr' }}>
                      <p className="text-emerald-400 text-xs font-bold flex items-center gap-1" style={{ fontFamily: fontStyle(lang) }}>
                        <i className="ri-shield-check-fill text-xs" />
                        {t('ڕووخسار پشکنراوە', 'تم التحقق من الوجه', 'Face Verified', lang)}
                      </p>
                      <p className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: fontStyle(lang) }}>
                        {t('ناسنامەی ڕووخسارت پاشەکەوتکرا', 'تم حفظ صورة وجهك', 'Face image saved', lang)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setFaceImageUrl(null); setFaceVerified(false); setFaceScanOpen(true) }}
                      className="flex items-center gap-1 text-gray-500 hover:text-gray-300 text-xs transition-colors"
                      style={{ fontFamily: fontStyle(lang) }}
                    >
                      <i className="ri-camera-line text-sm" />
                      {t('دووبارە', 'إعادة', 'Retake', lang)}
                    </button>
                  </div>
                )}
              </div>

              {/* ── Form fields ───────────────────────────────────── */}
              <div className="p-6 space-y-5 relative">

                {/* Lock overlay — tap hint when fields are locked */}
                {fieldsLocked && (
                  <div
                    className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 rounded-b-2xl cursor-pointer"
                    style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(1px)' }}
                    onClick={() => setFaceScanOpen(true)}
                  >
                    <div className="w-11 h-11 rounded-full flex items-center justify-center"
                      style={{ background: 'rgba(200,169,110,0.12)', border: '1.5px solid rgba(200,169,110,0.4)' }}>
                      <i className="ri-lock-line text-xl" style={{ color: GOLD }} />
                    </div>
                    <p className="text-white/80 text-sm font-semibold text-center px-6" style={{ fontFamily: fontStyle(lang) }}>
                      {t('سەرەتا ڕووخسارت سکان بکە', 'امسح وجهك أولاً', 'Scan your face first', lang)}
                    </p>
                    <p className="text-gray-500 text-xs text-center px-6" style={{ fontFamily: fontStyle(lang) }}>
                      {t('کلیک بکە بۆ کردنەوەی کامێرا', 'انقر لفتح الكاميرا', 'Click to open camera', lang)}
                    </p>
                  </div>
                )}

              {field('name',
                t('ناوی تەواو', 'الاسم الكامل', 'Full Name', lang),
                'text',
                { placeholder: t('ناوت بنووسە', 'أدخل اسمك', 'Enter your name', lang) }
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('guest_count', t('ژمارەی میوان', 'عدد الضيوف', 'Number of Guests', lang), 'number', { min: 1, max: 100, placeholder: '1' })}
                {field('phone',       t('ژمارەی تەلەفۆن', 'رقم الهاتف', 'Phone Number', lang),     'tel',    { placeholder: '07XX XXX XXXX', dir: 'ltr' })}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {field('date', t('بەروار', 'التاريخ', 'Date', lang), 'date', { min: new Date().toISOString().split('T')[0] })}
                {field('time', t('کات',    'الوقت',   'Time', lang), 'time')}
              </div>

              {field('note',
                t('تێبینی (ئارەزوو مەندانە)', 'ملاحظة (اختياري)', 'Note (optional)', lang),
                'textarea',
                { placeholder: t('هەر تێبینییەک...', 'أي ملاحظات...', 'Any notes...', lang) }
              )}
              </div>{/* /fields wrapper */}
            </div>{/* /form card */}

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading || fieldsLocked || faceUploading}
              onClick={fieldsLocked ? (e) => { e.preventDefault(); setFaceScanOpen(true) } : undefined}
              className="w-full py-4 text-white font-black text-lg rounded-2xl disabled:cursor-not-allowed transition-all"
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
          </form>
        )}

      </div>
    </Wrapper>
  )
}
