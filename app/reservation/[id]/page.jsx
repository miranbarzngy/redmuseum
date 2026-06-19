'use client'

import Link from 'next/link'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import { useEffect, useState } from 'react'

const STATUS = {
  pending:   { ku: 'چاوەڕوانکراو', en: 'Pending',   bg: '#fef9ec', color: '#92400e', border: '#f59e0b', dot: '#f59e0b' },
  approved:  { ku: 'پەسەندکراو',   en: 'Approved',  bg: '#eff6ff', color: '#1e40af', border: '#3b82f6', dot: '#3b82f6' },
  visited:   { ku: 'سەردانکراو',   en: 'Visited',   bg: '#f0fdf4', color: '#065f46', border: '#10b981', dot: '#10b981' },
  cancelled: { ku: 'هەڵوەشاوەتەوە', en: 'Cancelled', bg: '#fff1f2', color: '#991b1b', border: '#ef4444', dot: '#ef4444' },
}

const KU = { fontFamily: 'UniSalar, Tahoma, sans-serif' }

function Field({ ku, en, value, mono }) {
  return (
    <div className="py-2.5 border-b border-gray-100 last:border-0">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5 flex gap-1.5 items-center flex-wrap" dir="rtl">
        <span style={KU}>{ku}</span>
        <span className="opacity-50">·</span>
        <span>{en}</span>
      </p>
      <p
        className={`font-bold text-gray-900 text-sm ${mono ? 'font-mono tracking-wide' : ''}`}
        dir={mono ? 'ltr' : 'rtl'}
        style={mono ? { fontFamily: "'Courier New', Courier, monospace" } : KU}
      >
        {value}
      </p>
    </div>
  )
}

export default function ReservationPage() {
  const { id } = useParams()
  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)
  const [qrUrl, setQrUrl] = useState('')

  useEffect(() => { setQrUrl(window.location.href) }, [])

  useEffect(() => {
    if (!id) return
    fetch(`/api/reservation/${id}`)
      .then(r => r.json())
      .then(json => { if (json.data) setReservation(json.data); else setNotFound(true) })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="w-10 h-10 border-4 border-red-700 border-t-transparent rounded-full animate-spin" />
    </div>
  )

  if (notFound) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <div className="text-center">
        <div className="text-6xl mb-4">🎫</div>
        <h1 className="text-xl font-bold text-gray-800 mb-1" style={KU}>داواکاری نەدۆزرایەوە</h1>
        <p className="text-gray-500 text-sm mb-6">Reservation not found</p>
        <Link href="/kurdish" className="px-6 py-2.5 bg-red-700 hover:bg-red-800 text-white rounded-xl text-sm font-semibold transition-colors">
          بگەڕێوە / Go Back
        </Link>
      </div>
    </div>
  )

  const s = STATUS[reservation.status] || STATUS.pending
  const ref = reservation.id.slice(0, 8).toUpperCase()
  const dateFormatted = new Date(reservation.date + 'T00:00:00').toLocaleDateString('en-GB', { year: 'numeric', month: 'long', day: 'numeric' })
  const submittedAt = new Date(reservation.created_at).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })

  return (
    <>
      <style>{`
        @media print {
          @page { margin: 0; size: A4 portrait; }
          body { background: white !important; }
          .no-print { display: none !important; }
          .pass-card { box-shadow: none !important; border-radius: 0 !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 print:bg-white">
        <div className="w-full max-w-2xl mx-auto px-3 sm:px-4 py-5 sm:py-8 print:p-0 print:max-w-full">

          {/* ── Top nav bar (hidden when printing) ── */}
          <div className="no-print flex items-center justify-between mb-4">
            <Link
              href="/kurdish"
              className="flex items-center gap-2 text-sm font-semibold text-gray-700 hover:text-gray-900 bg-white hover:bg-gray-50 px-4 py-2.5 rounded-xl shadow-sm border border-gray-200 transition-all"
              style={KU}
            >
              ← بگەڕێوە بۆ ماڵپەڕ
            </Link>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-2 text-sm font-semibold bg-[#7a0000] hover:bg-[#a00000] text-white px-4 py-2.5 rounded-xl shadow-sm transition-colors"
              style={KU}
            >
              🖨 چاپکردن
            </button>
          </div>

          {/* ── Pass card ── */}
          <div className="pass-card w-full bg-white rounded-2xl sm:rounded-3xl shadow-xl overflow-hidden">

            {/* Header */}
            <div className="bg-[#7a0000] text-white px-4 sm:px-7 py-4 sm:py-5">
              <div className="flex items-center justify-between gap-2">

                {/* Logo + name */}
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-lg sm:text-xl shadow-inner shrink-0">
                    M
                  </div>
                  <div className="min-w-0">
                    <p className="text-[9px] sm:text-[10px] uppercase tracking-[0.15em] text-gray-400">Official Pass</p>
                    <p className="text-[11px] sm:text-xs font-semibold text-white/80 truncate" style={KU}>مۆزەخانەی ئەمنە سورەکە</p>
                  </div>
                </div>

                {/* Pass title */}
                <div className="text-right shrink-0">
                  <p className="text-[8px] sm:text-[9px] tracking-[0.15em] text-gray-400 uppercase mb-0.5" style={KU}>فۆڕمی سەردانکاران</p>
                  <p className="text-sm sm:text-base font-black tracking-[0.1em] sm:tracking-[0.2em] uppercase">VISITOR PASS</p>
                  <p className="text-[10px] font-mono text-gray-400 mt-0.5">REF: {ref}</p>
                </div>

              </div>
            </div>

            {/* Gold accent */}
            <div className="h-1 bg-gradient-to-r from-[#7a0000] via-[#c8a96e] to-[#7a0000]" />

            {/* Status banner */}
            <div
              className="px-4 sm:px-7 py-2.5 flex items-center gap-2.5"
              style={{ background: s.bg, borderBottom: `1px solid ${s.border}33` }}
            >
              <span className="w-2 h-2 rounded-full shrink-0" style={{ background: s.dot }} />
              <span className="text-xs font-bold" style={{ color: s.color }}>
                <span style={KU}>{s.ku}</span>
                <span className="opacity-60 mx-1.5">·</span>
                {s.en}
              </span>
            </div>

            {/* Body: details + QR */}
            <div className="grid grid-cols-1 md:grid-cols-[1fr_auto]">

              {/* Details */}
              <div className="px-4 sm:px-7 py-4 sm:py-6 border-b md:border-b-0 md:border-r border-gray-100">
                <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-red-700 mb-3 flex items-center gap-2" style={KU}>
                  <span className="w-3 h-px bg-red-600 block shrink-0" />
                  وردەکاری داواکاری
                  <span className="opacity-40 font-normal hidden sm:inline">· Reservation Details</span>
                </h2>

                <Field ku="ناوی تەواو"      en="Full Name"        value={reservation.name} />
                <Field ku="ژمارەی مۆبایل"  en="Phone Number"     value={reservation.phone} mono />
                <Field ku="ژمارەی میوان"   en="Number of Guests" value={`${reservation.guest_count} کەس · ${reservation.guest_count} People`} />
                <Field ku="بەرواری سەردان" en="Visit Date"       value={dateFormatted} mono />
                <Field ku="کاتی سەردان"   en="Visit Time"       value={reservation.time?.slice(0, 5)} mono />
                {reservation.note && <Field ku="تێبینی" en="Note" value={reservation.note} />}
                <Field ku="کاتی تۆمارکردن" en="Submitted"        value={submittedAt} mono />
              </div>

              {/* QR */}
              <div className="flex flex-col items-center justify-center gap-3 px-5 sm:px-8 py-5 sm:py-6 bg-gray-50/60">
                <div className="bg-white rounded-2xl p-3 shadow-md border border-gray-100">
                  <QRCodeSVG
                    value={qrUrl || `${typeof window !== 'undefined' ? window.location.href : ''}`}
                    size={130}
                    bgColor="#ffffff"
                    fgColor="#1a1a1a"
                    level="H"
                    includeMargin={false}
                  />
                </div>
                <div className="text-center">
                  <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5" style={KU}>سکان بکە بۆ پشتڕاستکردنەوە</p>
                  <p className="text-[9px] uppercase tracking-widest text-gray-300">SCAN TO VERIFY</p>
                  <p className="font-mono text-xs font-black text-red-700 mt-1.5 tracking-widest" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                    RESERVATION · {ref}
                  </p>
                </div>
              </div>

            </div>

            {/* Tear line */}
            <div className="relative flex items-center px-4">
              <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shrink-0 -ml-2.5 border border-gray-200" />
              <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
              <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full shrink-0 -mr-2.5 border border-gray-200" />
            </div>

            {/* Footer */}
            <div className="px-4 sm:px-7 py-3 sm:py-4 bg-gray-50" dir="rtl">
              <p className="text-xs font-semibold text-gray-700" style={KU}>مۆزەخانەی نیشتمانی ئەمنە سورەکە</p>
              <p className="text-[10px] text-gray-400 mt-0.5" dir="ltr">Amna Suraka National Museum · Sulaymaniyah, Kurdistan</p>
              <p className="text-[10px] text-gray-300 mt-0.5 hidden sm:block" style={KU}>ئەم پاسە پێشکەش بکە کاتێک دەگەیتە مۆزەخانەکە</p>
            </div>

          </div>
        </div>
      </div>
    </>
  )
}
