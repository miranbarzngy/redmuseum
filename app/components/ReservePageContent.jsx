'use client'

import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'
import Sidebar from './Sidebar'
import { getSupabaseClient } from '../lib/supabase-client'

const t = (ku, ar, en, lang) =>
  lang === 'ku' ? ku : lang === 'ar' ? ar : en

const fontStyle = (lang) =>
  lang === 'ku' ? 'UniSalar, Tahoma, sans-serif'
  : lang === 'ar' ? 'Cairo, Tahoma, sans-serif'
  : 'inherit'

const EMPTY = {
  name: '', guest_count: '', phone: '', date: '', time: '', note: ''
}

export default function ReservePageContent({ initialLang = 'ku' }) {
  const [lang, setLang] = useState(initialLang)
  const [form, setForm] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [reservation, setReservation] = useState(null)
  const [availableDays, setAvailableDays] = useState(['1','2','3','4','5'])
  const [availableHours, setAvailableHours] = useState({ start: '09:00', end: '17:00' })
  const qrRef = useRef(null)

  useEffect(() => {
    const saved = localStorage.getItem('museum-lang')
    if (saved) setLang(saved)
  }, [])

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
    const channel = supabase
      .channel('reserve-settings')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'site_settings' },
        ({ new: row }) => {
          if (row?.key === 'available_days') try { setAvailableDays(JSON.parse(row.value)) } catch {}
          if (row?.key === 'available_hours') try { setAvailableHours(JSON.parse(row.value)) } catch {}
        })
      .subscribe()
    return () => supabase.removeChannel(channel)
  }, [])

  const isRtl = lang === 'ku' || lang === 'ar'

  const validate = () => {
    const e = {}
    if (!form.name.trim()) e.name = true
    if (!form.guest_count || Number(form.guest_count) < 1) e.guest_count = true
    if (!form.phone.trim()) e.phone = true
    if (!form.date) {
      e.date = true
    } else {
      const dow = String(new Date(form.date + 'T12:00:00').getDay())
      if (!availableDays.includes(dow)) e.date = 'unavailable'
    }
    if (!form.time) {
      e.time = true
    } else if (form.time < availableHours.start || form.time > availableHours.end) {
      e.time = 'outofrange'
    }
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
        }),
      })
      const json = await res.json()
      if (!res.ok) throw new Error(json.error || 'Unknown error')
      setReservation(json.data)
    } catch (err) {
      console.error('Reservation error:', err)
      alert(t('کێشەیەک ڕوویدا، دووبارە هەوڵبدەوە', 'حدث خطأ، حاول مرة أخرى', 'An error occurred, please try again', lang) + '\n\n' + err.message)
    } finally {
      setLoading(false)
    }
  }

  const downloadQR = () => {
    const svg = qrRef.current?.querySelector('svg')
    if (!svg) return
    const serializer = new XMLSerializer()
    const svgStr = serializer.serializeToString(svg)
    const canvas = document.createElement('canvas')
    canvas.width = 300; canvas.height = 300
    const ctx = canvas.getContext('2d')
    const img = new window.Image()
    img.onload = () => {
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, 300, 300)
      ctx.drawImage(img, 0, 0, 300, 300)
      const a = document.createElement('a')
      a.download = `reservation-${reservation.id.slice(0, 8)}.png`
      a.href = canvas.toDataURL('image/png')
      a.click()
    }
    img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)))
  }

  const homeHref = lang === 'ar' ? '/arabic' : lang === 'ku' ? '/kurdish' : '/'

  const field = (key, label, type = 'text', extra = {}) => (
    <div>
      <label
        className="block text-sm font-medium text-gray-300 mb-1"
        style={{ fontFamily: fontStyle(lang) }}
      >
        {label}{key !== 'note' && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'textarea' ? (
        <textarea
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          rows={3}
          className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors resize-none"
          style={{ fontFamily: fontStyle(lang) }}
          {...extra}
        />
      ) : (
        <input
          type={type}
          value={form[key]}
          onChange={e => setForm(p => ({ ...p, [key]: e.target.value }))}
          className={`w-full px-4 py-3 bg-white/5 border rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-red-500 transition-colors date-input ${errors[key] ? 'border-red-500 bg-red-500/5' : 'border-white/10'}`}
          style={{ fontFamily: fontStyle(lang), colorScheme: 'dark' }}
          {...extra}
        />
      )}
      {errors[key] && (
        <p className="text-red-400 text-xs mt-1" style={{ fontFamily: fontStyle(lang) }}>
          {errors[key] === 'unavailable'
            ? t('ئەم رۆژە بەردەست نییە', 'هذا اليوم غير متاح', 'This day is not available', lang)
            : errors[key] === 'outofrange'
            ? t(
                `کات دەبێت لە نێوان ${availableHours.start} و ${availableHours.end} بێت`,
                `يجب أن يكون الوقت بين ${availableHours.start} و ${availableHours.end}`,
                `Time must be between ${availableHours.start} and ${availableHours.end}`,
                lang
              )
            : t('ئەم خانەیە پێویستە', 'هذا الحقل مطلوب', 'This field is required', lang)
          }
        </p>
      )}
    </div>
  )

  if (reservation) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4 py-16">
        <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-checkbox-circle-line text-green-400 text-3xl" />
          </div>

          <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: fontStyle(lang) }}>
            {t('داواکارییەکەت تۆمارکرا!', 'تم تسجيل طلبك!', 'Reservation Submitted!', lang)}
          </h1>
          <p className="text-gray-400 mb-8 text-sm" style={{ fontFamily: fontStyle(lang) }}>
            {t(
              'تکایە ئەم کیوئارکۆدە وەک پشکنین لە دەرگای مۆزەخانەکە پیشان بدە',
              'يرجى إظهار رمز QR هذا عند مدخل المتحف للتحقق',
              'Please show this QR code at the museum entrance for verification',
              lang
            )}
          </p>

          <div className="bg-white rounded-2xl p-6 mx-auto w-fit mb-6 shadow-2xl" ref={qrRef}>
            <QRCodeSVG
              value={`${typeof window !== 'undefined' ? window.location.origin : ''}/reservation/${reservation.id}`}
              size={200}
              bgColor="#ffffff"
              fgColor="#0a0a0a"
              level="H"
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-xl p-5 mb-6 text-left" dir={isRtl ? 'rtl' : 'ltr'}>
            <div className="space-y-2 text-sm">
              {[
                [t('ناو', 'الاسم', 'Name', lang), reservation.name],
                [t('ژمارەی میوان', 'عدد الضيوف', 'Guests', lang), reservation.guest_count],
                [t('بەروار', 'التاريخ', 'Date', lang), reservation.date],
                [t('کات', 'الوقت', 'Time', lang), reservation.time],
                [t('ناسنامەی داواکاری', 'معرف الحجز', 'Reservation ID', lang), reservation.id.slice(0, 8).toUpperCase()],
              ].map(([label, val]) => (
                <div key={label} className="flex justify-between gap-4">
                  <span className="text-gray-400" style={{ fontFamily: fontStyle(lang) }}>{label}</span>
                  <span className="text-white font-medium" style={{ fontFamily: fontStyle(lang) }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 justify-center flex-wrap">
            <button
              onClick={downloadQR}
              className="flex items-center gap-2 px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-lg transition-colors"
              style={{ fontFamily: fontStyle(lang) }}
            >
              <i className="ri-download-line" />
              {t('داونلۆدی QR', 'تحميل QR', 'Download QR', lang)}
            </button>
            <button
              onClick={() => { setReservation(null); setForm(EMPTY) }}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
              style={{ fontFamily: fontStyle(lang) }}
            >
              <i className="ri-add-line" />
              {t('داواکارییەکی تر', 'حجز آخر', 'Another Booking', lang)}
            </button>
            <Link
              href={homeHref}
              className="flex items-center gap-2 px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white text-sm font-semibold rounded-lg transition-colors"
              style={{ fontFamily: fontStyle(lang) }}
            >
              <i className="ri-home-line" />
              {t('سەرەتا', 'الرئيسية', 'Home', lang)}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      className="min-h-screen bg-[#0a0a0a] text-white px-4 py-16"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <style>{`
        .date-input::-webkit-calendar-picker-indicator {
          filter: invert(15%) sepia(100%) saturate(7000%) hue-rotate(0deg) brightness(90%);
          cursor: pointer;
        }
      `}</style>
      <Sidebar activeSection="reserve" currentLang={lang} onLangChange={setLang} />
      <div className="max-w-xl mx-auto">

        <div className="text-center mb-10">
          <Link href={homeHref} className="inline-flex items-center gap-2 text-gray-400 hover:text-white text-sm mb-8 transition-colors">
            <i className={`ri-arrow-${isRtl ? 'right' : 'left'}-line`} />
            <span style={{ fontFamily: fontStyle(lang) }}>
              {t('گەڕانەوە', 'رجوع', 'Back', lang)}
            </span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-black mb-3" style={{ fontFamily: fontStyle(lang) }}>
            {t('داواکاری سەردانکردن', 'حجز زيارة', 'Reserve a Visit', lang)}
          </h1>
          <p className="text-gray-400 text-sm" style={{ fontFamily: fontStyle(lang) }}>
            {t(
              'فۆرمەکە پڕبکەوە، QR کۆدێک وەردەگریت بۆ دەرگای مۆزەخانەکە',
              'أكمل النموذج وستحصل على رمز QR لمدخل المتحف',
              'Fill the form and receive a QR code for museum entry',
              lang
            )}
          </p>
          <div className="w-16 h-1 bg-red-600 mx-auto mt-5" />
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="bg-white/3 border border-white/8 rounded-2xl p-6 space-y-5">

            {field('name',
              t('ناوی تەواو', 'الاسم الكامل', 'Full Name', lang),
              'text',
              { placeholder: t('ناوت بنووسە', 'أدخل اسمك', 'Enter your name', lang) }
            )}

            <div className="grid grid-cols-2 gap-4">
              {field('guest_count',
                t('ژمارەی میوان', 'عدد الضيوف', 'Number of Guests', lang),
                'number',
                { min: 1, max: 100, placeholder: '1' }
              )}
              {field('phone',
                t('ژمارەی تەلەفۆن', 'رقم الهاتف', 'Phone Number', lang),
                'tel',
                { placeholder: '07XX XXX XXXX', dir: 'ltr' }
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              {field('date',
                t('بەروار', 'التاريخ', 'Date', lang),
                'date',
                { min: new Date().toISOString().split('T')[0] }
              )}
              {field('time',
                t('کات', 'الوقت', 'Time', lang),
                'time'
              )}
            </div>

            {field('note',
              t('تێبینی (ئارەزووی تایبەت)', 'ملاحظة (اختياري)', 'Note (optional)', lang),
              'textarea',
              { placeholder: t('هەر تێبینییەک...', 'أي ملاحظات...', 'Any notes...', lang) }
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-lg rounded-xl transition-colors shadow-lg shadow-red-900/30"
            style={{ fontFamily: fontStyle(lang) }}
          >
            {loading
              ? t('ناردن...', 'جاري الإرسال...', 'Submitting...', lang)
              : t('تۆمارکردن و وەرگرتنی QR', 'تسجيل والحصول على QR', 'Submit & Get QR Code', lang)
            }
          </button>
        </form>
      </div>
    </div>
  )
}
