'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import QRCode from 'qrcode'
import { useEffect, useRef, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
import { useMuseumName } from '../lib/useMuseumName'
import Sidebar from './Sidebar'

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
  const [availableDays, setAvailableDays]   = useState(['1','2','3','4','5'])
  const [availableHours, setAvailableHours] = useState({ start: '09:00', end: '17:00' })
  const qrRef = useRef(null)
  const museumName = useMuseumName()

  const [trackPhone, setTrackPhone]     = useState('')
  const [trackLoading, setTrackLoading] = useState(false)
  const [trackResults, setTrackResults] = useState(null)
  const [trackError, setTrackError]     = useState('')

  const searchByPhone = async () => {
    const phone = trackPhone.trim()
    if (!phone) return
    setTrackLoading(true); setTrackError(''); setTrackResults(null)
    try {
      const supabase = getSupabaseClient()
      if (!supabase) throw new Error('Not configured')
      const { data, error } = await supabase.from('reservations').select('*').eq('phone', phone).order('date', { ascending: false })
      if (error) throw error
      setTrackResults(data || [])
    } catch {
      setTrackError(t('کێشەیەک ڕوویدا، دووبارە هەوڵبدەوە', 'حدث خطأ، حاول مرة أخرى', 'An error occurred, please try again', lang))
    } finally { setTrackLoading(false) }
  }

  useEffect(() => { const saved = localStorage.getItem('museum-lang'); if (saved) setLang(saved) }, [])

  useEffect(() => {
    Promise.all([
      fetch('/api/settings?key=available_days').then(r => r.json()),
      fetch('/api/settings?key=available_hours').then(r => r.json()),
    ]).then(([daysRes, hoursRes]) => {
      if (daysRes.value) try { setAvailableDays(JSON.parse(daysRes.value)) } catch {}
      if (hoursRes.value) try { setAvailableHours(JSON.parse(hoursRes.value)) } catch {}
    }).catch(() => {})

    const supabase = getSupabaseClient()
    if (!supabase) return
    const channel = supabase.channel('reserve-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' }, ({ new: row }) => {
        if (row?.key === 'available_days')  try { setAvailableDays(JSON.parse(row.value))  } catch {}
        if (row?.key === 'available_hours') try { setAvailableHours(JSON.parse(row.value)) } catch {}
      }).subscribe()
    return () => supabase.removeChannel(channel)
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
        body: JSON.stringify({ name: form.name.trim(), guest_count: Number(form.guest_count), phone: form.phone.trim(), date: form.date, time: form.time, note: form.note.trim() || null }),
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

    // Generate QR as image
    const qrUrl = `${window.location.origin}/reservation/${reservation.id}`
    const qrDataUrl = await QRCode.toDataURL(qrUrl, { width: 464, margin: 2, errorCorrectionLevel: 'H', color: { dark: '#0a0a0a', light: '#ffffff' } })
    const qrImg = await new Promise(resolve => { const img = new Image(); img.onload = () => resolve(img); img.src = qrDataUrl })

    // Canvas dimensions
    const W = 520, LOGO_H = 80, GOLD_H = 3, TITLE_H = 56, PAD = 28
    const QR_SIZE = W - PAD * 2
    const FOOTER_H = 96
    const H = LOGO_H + GOLD_H + TITLE_H + GOLD_H + QR_SIZE + FOOTER_H + 5

    const canvas = document.createElement('canvas')
    canvas.width = W; canvas.height = H
    const ctx = canvas.getContext('2d')

    // White base
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H)

    // ── Logo banner (dark red) ──
    ctx.fillStyle = '#6b0000'; ctx.fillRect(0, 0, W, LOGO_H)

    // Measure text to center group
    const ICON_SIZE = 44, GAP = 14
    ctx.font = `bold 15px ${kuFont}`
    const titleW = ctx.measureText(museumNameKr).width
    ctx.font = '11px Arial, sans-serif'
    const subW = ctx.measureText(museumNameEn).width
    const textBlockW = Math.max(titleW, subW)
    const groupStartX = (W - (textBlockW + GAP + ICON_SIZE)) / 2
    const ICON_X = groupStartX + textBlockW + GAP
    const ICON_Y = (LOGO_H - ICON_SIZE) / 2

    // Logo icon with white rounded box
    if (logoImg) {
      const BP = 3
      ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.roundRect(ICON_X - BP, ICON_Y - BP, ICON_SIZE + BP * 2, ICON_SIZE + BP * 2, 8); ctx.fill()
      ctx.save(); ctx.beginPath(); ctx.roundRect(ICON_X - BP, ICON_Y - BP, ICON_SIZE + BP * 2, ICON_SIZE + BP * 2, 8); ctx.clip()
      ctx.drawImage(logoImg, ICON_X - BP, ICON_Y - BP, ICON_SIZE + BP * 2, ICON_SIZE + BP * 2); ctx.restore()
    }

    // Museum name text
    const textRightX = groupStartX + textBlockW
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 15px ${kuFont}`; ctx.textAlign = 'right'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'
    ctx.fillText(museumNameKr, textRightX, LOGO_H / 2 - 11)
    ctx.direction = 'ltr'; ctx.font = '11px Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.65)'; ctx.textAlign = 'right'
    ctx.fillText(museumNameEn, textRightX, LOGO_H / 2 + 11)

    // ── Gold separator ──
    let y = LOGO_H
    const drawGold = () => {
      const g = ctx.createLinearGradient(0, 0, W, 0)
      g.addColorStop(0, 'transparent'); g.addColorStop(0.5, '#c8a96e'); g.addColorStop(1, 'transparent')
      ctx.fillStyle = g; ctx.fillRect(0, y, W, GOLD_H); y += GOLD_H
    }
    drawGold()

    // ── Reservation ID bar (museum red) ──
    ctx.fillStyle = '#7a0000'; ctx.fillRect(0, y, W, TITLE_H)
    const resId = '#' + reservation.id.slice(0, 8).toUpperCase()
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 20px 'Courier New', Courier, monospace`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'ltr'
    ctx.fillText(resId, W / 2, y + TITLE_H / 2)
    y += TITLE_H

    // ── Gold separator ──
    drawGold()

    // ── QR code ──
    ctx.fillStyle = '#ffffff'; ctx.fillRect(PAD, y, QR_SIZE, QR_SIZE)
    ctx.drawImage(qrImg, PAD, y, QR_SIZE, QR_SIZE)
    y += QR_SIZE

    // ── Footer ──
    ctx.fillStyle = '#111111'; ctx.fillRect(0, y, W, FOOTER_H)
    const fMid = y + FOOTER_H / 2
    ctx.fillStyle = '#ffffff'; ctx.font = `bold 15px ${kuFont}`
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.direction = 'rtl'
    ctx.fillText(reservation.name, W / 2, fMid - 18)
    ctx.direction = 'ltr'; ctx.font = '12px Arial, sans-serif'; ctx.fillStyle = 'rgba(255,255,255,0.55)'
    ctx.fillText(`${reservation.date}  ·  ${(reservation.time || '').slice(0, 5)}  ·  ${reservation.guest_count} guests`, W / 2, fMid + 4)
    // Gold accent line in footer
    const ag = ctx.createLinearGradient(0, 0, W, 0)
    ag.addColorStop(0, 'transparent'); ag.addColorStop(0.5, '#c8a96e'); ag.addColorStop(1, 'transparent')
    ctx.fillStyle = ag; ctx.fillRect(0, y + FOOTER_H - 24, W, 1)
    ctx.fillStyle = 'rgba(200,169,110,0.45)'; ctx.font = '10px Arial'; ctx.textAlign = 'center'
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

  const field = (key, label, type = 'text', extra = {}) => (
    <div>
      <label className="block text-sm font-semibold mb-2 text-white" style={{ fontFamily: fontStyle(lang) }}>
        {label}
        {key !== 'note' && <span className="ml-1" style={{ color: GOLD }}>*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          rows={3}
          style={{ ...inputBase, resize: 'none', borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,0.12)' }}
          onFocus={e  => { if (!errors[key]) e.target.style.borderColor = GOLD }}
          onBlur={e   => { if (!errors[key]) e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          {...extra}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className={`date-input${(type === 'date' || type === 'time') ? ' picker-input' : ''}`}
          style={{ ...inputBase, borderColor: errors[key] ? '#ef4444' : 'rgba(255,255,255,0.12)', minHeight: (type === 'date' || type === 'time') ? 52 : 'auto' }}
          onFocus={e  => { if (!errors[key]) e.target.style.borderColor = GOLD }}
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
            <span className="block flex-1 max-w-[60px] h-px rounded-full" style={{ background: 'linear-gradient(to right, transparent, #cc0000)' }} />
            <h1 className="text-2xl md:text-3xl font-black text-white text-center" style={{ fontFamily: fontStyle(lang) }}>
              {t('داواکارییەکەت تۆمارکرا!', 'تم تسجيل طلبك!', 'Reservation Submitted!', lang)}
            </h1>
            <span className="block flex-1 max-w-[60px] h-px rounded-full" style={{ background: 'linear-gradient(to left, transparent, #cc0000)' }} />
          </div>

          {/* Gold diamond divider */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-10" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-10" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-white text-sm text-center leading-relaxed" style={{ fontFamily: fontStyle(lang) }}>
            {t('تکایە ئەم کیوئارکۆدە وەک پشکنین لە دەرگای مۆزەخانەکە پیشان بدە', 'يرجى إظهار رمز QR هذا عند مدخل المتحف للتحقق', 'Please show this QR code at the museum entrance for verification', lang)}
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
              <span className="text-white/60 text-[10px] mt-0.5">{museumName.en}</span>
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

          {/* QR itself */}
          <div className="flex justify-center px-6 py-6" ref={qrRef} style={{ background: '#111' }}>
            <div className="rounded-2xl p-4 shadow-2xl" style={{ background: '#fff', border: `1.5px solid rgba(200,169,110,0.35)` }}>
              <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}`} size={190} bgColor="#ffffff" fgColor="#0a0a0a" level="H" />
            </div>
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
                    <span className="text-[10px] text-white/70 uppercase tracking-wider" style={{ fontFamily: fontStyle(lang) }}>{label}</span>
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
              <span className="text-[10px] text-white/70 uppercase tracking-wider flex items-center gap-1.5" style={{ fontFamily: fontStyle(lang) }}>
                <i className="ri-fingerprint-line text-[10px]" style={{ color: GOLD }} />
                {t('ناسنامەی داواکاری','معرف الحجز','Reservation ID',lang)}
              </span>
              <bdo dir="ltr" className="res-id text-sm font-bold" style={{ color: GOLD }}>{resId}</bdo>
            </div>
          </div>

          {/* Gold bottom bar */}
          <div className="h-[5px]" style={{ background: 'linear-gradient(to right, #7a0000, #c8a96e, #7a0000)' }} />
        </div>

        {/* Actions */}
        <div className="flex gap-3 flex-wrap">
          <button onClick={downloadQR}
            className="flex-1 flex items-center justify-center gap-2 py-3.5 text-white text-sm font-bold rounded-2xl transition-all"
            style={{ background: RED, border: `1px solid rgba(200,169,110,0.35)`, boxShadow: '0 4px 20px rgba(122,0,0,0.35)', fontFamily: fontStyle(lang) }}>
            <i className="ri-download-2-line text-base" style={{ color: GOLD }} />
            {t('داونلۆدی QR','تحميل QR','Download QR',lang)}
          </button>
          <button onClick={() => { setReservation(null); setForm(EMPTY) }}
            className="flex items-center justify-center gap-2 px-5 py-3.5 text-white text-sm font-bold rounded-2xl transition-all"
            style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontStyle(lang) }}>
            <i className="ri-add-line" />
            {t('داواکارییەکی تر','حجز آخر','New Booking',lang)}
          </button>
          {!inline && (
            <Link href={homeHref}
              className="flex items-center justify-center gap-2 px-5 py-3.5 text-white text-sm font-bold rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', fontFamily: fontStyle(lang) }}>
              <i className="ri-home-5-line" />
              {t('سەرەتا','الرئيسية','Home',lang)}
            </Link>
          )}
        </div>

        {/* Bottom gold accent */}
        <div className="h-px mt-10" style={{ background: `linear-gradient(to right, transparent, rgba(200,169,110,0.2), transparent)` }} />

      </div>
    )

    if (inline) return (
      <section id="reserve" className="text-white px-4 py-16" style={{ background: '#0a0a0a' }} dir={isRtl ? 'rtl' : 'ltr'}>
        {successContent}
      </section>
    )
    return (
      <div className="min-h-screen text-white flex items-center justify-center px-4 py-16" style={{ background: '#0a0a0a' }}>
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
      className={inline ? 'text-white pl-[72px] pr-4 md:px-8 py-16' : 'min-h-screen text-white px-4 py-16'}
      style={{ background: '#0a0a0a' }}
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
            <Link href={homeHref} className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm mb-8 transition-colors" style={{ fontFamily: fontStyle(lang) }}>
              <i className={`ri-arrow-${isRtl ? 'right' : 'left'}-line`} />
              {t('گەڕانەوە', 'رجوع', 'Back', lang)}
            </Link>
          )}

          {/* Decorative lines + title */}
          <div className="flex items-center justify-center gap-4 mb-4">
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to right, transparent, #cc0000)' }} />
            <h1 className="text-3xl md:text-4xl font-black text-white" style={{ fontFamily: fontStyle(lang) }}>
              {t('داواکاری سەردانکردن', 'حجز زيارة', 'Reserve a Visit', lang)}
            </h1>
            <span className="block w-16 h-1 rounded-full" style={{ background: 'linear-gradient(to left, transparent, #cc0000)' }} />
          </div>

          {/* Diamond divider */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="h-px w-12" style={{ background: `linear-gradient(to right, transparent, ${GOLD})` }} />
            <div className="w-1.5 h-1.5 rotate-45" style={{ background: GOLD }} />
            <div className="h-px w-12" style={{ background: `linear-gradient(to left, transparent, ${GOLD})` }} />
          </div>

          <p className="text-white text-sm leading-relaxed" style={{ fontFamily: fontStyle(lang) }}>
            {t(
              '"فۆرمەکە پڕ بکەرەوە و QR کۆدەکە دابگرە بۆ پاراستنی مافی سەردانیکردن و پیشاندانی لە کاتی سەردانیکردنت بۆ مۆزەخانە."',
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
              onClick={() => { setPageTab(tab.id); setTrackResults(null); setTrackError('') }}
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
              <p className="text-white/60 text-sm" style={{ fontFamily: fontStyle(lang) }}>
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
              <div className="text-center py-12 text-white/40">
                <i className="ri-inbox-line text-4xl mb-3 block" />
                <p style={{ fontFamily: fontStyle(lang) }}>{t('هیچ داواکارییەک نەدۆزرایەوە', 'لا توجد حجوزات بهذا الرقم', 'No reservations found for this number', lang)}</p>
              </div>
            )}

            {trackResults && trackResults.length > 0 && (
              <div className="space-y-3">
                <p className="text-xs text-white/30 font-semibold uppercase tracking-wider" style={{ fontFamily: fontStyle(lang) }}>
                  {trackResults.length} {t('داواکاری', 'حجز', 'reservation(s) found', lang)}
                </p>
                {trackResults.map(res => {
                  const sc = STATUS_COLOR[res.status] || STATUS_COLOR.pending
                  const statusLabel = { pending: t('چاوەڕوان بە','قيد الانتظار','Pending',lang), approved: t('پەسەندکراوە','مقبول','Approved',lang), visited: t('سەردانکرا','تمت الزيارة','Visited',lang) }[res.status] || res.status
                  return (
                    <div key={res.id} className={`rounded-2xl border p-5 ${sc.bg} ${sc.border}`}>
                      <div className="flex items-start justify-between gap-3 mb-4">
                        <div>
                          <p className="font-bold text-white text-base" style={{ fontFamily: fontStyle(lang) }}>{res.name}</p>
                          <p className="text-xs text-white/30 font-mono mt-0.5">#{res.id.slice(0,8).toUpperCase()}</p>
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
                            <p className="text-white/40 text-xs mb-0.5" style={{ fontFamily: fontStyle(lang) }}>{label}</p>
                            <p className="text-white font-semibold">{val}</p>
                          </div>
                        ))}
                      </div>
                      {res.note && <p className="mt-3 text-xs text-white/40 italic border-t border-white/5 pt-3" style={{ fontFamily: fontStyle(lang) }}>{res.note}</p>}
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
            <div className="rounded-2xl p-6 space-y-5 relative overflow-hidden"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,169,110,0.15)' }}>
              {/* Gold top accent */}
              <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />

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
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 text-white font-black text-lg rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{
                background: RED,
                border: `1px solid rgba(200,169,110,0.35)`,
                boxShadow: '0 8px 32px rgba(122,0,0,0.4)',
                fontFamily: fontStyle(lang),
              }}
            >
              {loading
                ? t('ناردن...', 'جاري الإرسال...', 'Submitting...', lang)
                : t('تۆمارکردن و وەرگرتنی QR', 'تسجيل والحصول على QR', 'Submit & Get QR Code', lang)
              }
            </button>
          </form>
        )}

      </div>
    </Wrapper>
  )
}
