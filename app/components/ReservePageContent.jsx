'use client'

import Link from 'next/link'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useRef, useState } from 'react'
import { getSupabaseClient } from '../lib/supabase-client'
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

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const svgStr = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 300
    const ctx = canvas.getContext('2d')
    const img = new window.Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, 300, 300); ctx.drawImage(img, 0, 0, 300, 300)
      const a = document.createElement('a')
      a.download = `reservation-${reservation.id.slice(0, 8)}.png`
      a.href = canvas.toDataURL('image/png'); a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
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
    const successContent = (
      <div className={inline ? 'max-w-md mx-auto text-center py-8' : 'max-w-md w-full text-center'}>
        {/* Check icon */}
        <div className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6"
          style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
          <i className="ri-checkbox-circle-line text-green-400 text-4xl" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2" style={{ fontFamily: fontStyle(lang) }}>
          {t('داواکارییەکەت تۆمارکرا!', 'تم تسجيل طلبك!', 'Reservation Submitted!', lang)}
        </h1>
        <p className="text-white/60 mb-8 text-sm" style={{ fontFamily: fontStyle(lang) }}>
          {t('تکایە ئەم کیوئارکۆدە وەک پشکنین لە دەرگای مۆزەخانەکە پیشان بدە', 'يرجى إظهار رمز QR هذا عند مدخل المتحف للتحقق', 'Please show this QR code at the museum entrance for verification', lang)}
        </p>
        {/* QR */}
        <div className="rounded-2xl p-6 mx-auto w-fit mb-6 shadow-2xl" ref={qrRef}
          style={{ background: '#fff', border: `2px solid ${GOLD}` }}>
          <QRCodeSVG value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}`} size={200} bgColor="#ffffff" fgColor="#0a0a0a" level="H" />
        </div>
        {/* Details card */}
        <div className="rounded-2xl p-5 mb-6 text-left relative overflow-hidden"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(200,169,110,0.2)' }}
          dir={isRtl ? 'rtl' : 'ltr'}>
          <div className="absolute top-0 left-0 right-0 h-px" style={{ background: `linear-gradient(to right, transparent, ${GOLD}, transparent)` }} />
          <div className="space-y-2.5 text-sm">
            {[
              { label: t('ناو','الاسم','Name',lang),                   val: reservation.name },
              { label: t('ژمارەی میوان','عدد الضيوف','Guests',lang),   val: reservation.guest_count },
              { label: t('بەروار','التاريخ','Date',lang),               val: reservation.date },
              { label: t('کات','الوقت','Time',lang),                    val: (reservation.time || '').slice(0, 5) },
              { label: t('ناسنامەی داواکاری','معرف الحجز','Reservation ID',lang), val: reservation.id.slice(0,8).toUpperCase(), mono: true },
            ].map(({ label, val, mono }) => (
              <div key={label} className="flex justify-between gap-4">
                <span className="text-white/50" style={{ fontFamily: fontStyle(lang) }}>{label}</span>
                <span className="text-white font-semibold" dir="ltr" style={{ fontFamily: mono ? 'monospace' : fontStyle(lang) }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
        {/* Actions */}
        <div className="flex gap-3 justify-center flex-wrap">
          <button onClick={downloadQR}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-2xl transition-all"
            style={{ background: RED, border: `1px solid rgba(200,169,110,0.35)`, fontFamily: fontStyle(lang) }}>
            <i className="ri-download-line" />{t('داونلۆدی QR','تحميل QR','Download QR',lang)}
          </button>
          <button onClick={() => { setReservation(null); setForm(EMPTY) }}
            className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-2xl transition-all"
            style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: fontStyle(lang) }}>
            <i className="ri-add-line" />{t('داواکارییەکی تر','حجز آخر','Another Booking',lang)}
          </button>
          {!inline && (
            <Link href={homeHref}
              className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-bold rounded-2xl transition-all"
              style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.12)', fontFamily: fontStyle(lang) }}>
              <i className="ri-home-line" />{t('سەرەتا','الرئيسية','Home',lang)}
            </Link>
          )}
        </div>
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
