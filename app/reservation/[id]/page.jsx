'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

const STATUS = {
  pending:   { ku: 'چاوەڕوانکراو', en: 'Pending',   bg: '#fef9ec', color: '#92400e', border: '#f59e0b', dot: '#f59e0b' },
  approved:  { ku: 'پەسەندکراو',   en: 'Approved',  bg: '#eff6ff', color: '#1e40af', border: '#3b82f6', dot: '#3b82f6' },
  visited:   { ku: 'سەردانکراو',   en: 'Visited',   bg: '#f0fdf4', color: '#065f46', border: '#10b981', dot: '#10b981' },
  cancelled: { ku: 'هەڵوەشاوەتەوە', en: 'Cancelled', bg: '#fff1f2', color: '#991b1b', border: '#ef4444', dot: '#ef4444' },
}

const KU = { fontFamily: 'UniSalar, Tahoma, sans-serif' }

function Field({ ku, en, value, mono }) {
  return (
    <div className="py-3 border-b border-gray-100 last:border-0">
      <p className="text-[10px] uppercase tracking-widest text-gray-400 mb-0.5 flex gap-1.5 items-center" dir="rtl">
        <span style={KU}>{ku}</span>
        <span className="opacity-50">·</span>
        <span>{en}</span>
      </p>
      <p className={`font-bold text-gray-900 text-sm ${mono ? 'font-mono tracking-wide' : ''}`} dir={mono ? 'ltr' : 'rtl'} style={mono ? { fontFamily: "'Courier New', Courier, monospace" } : KU}>
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
          .pass-card { box-shadow: none !important; border-radius: 0 !important; max-width: 100% !important; }
        }
      `}</style>

      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center p-4 print:bg-white print:block print:p-0">

        <div className="pass-card w-full max-w-2xl bg-white rounded-3xl shadow-2xl overflow-hidden">

          {/* ── Header ── */}
          <div className="bg-[#7a0000] text-white px-7 py-5">
            <div className="flex items-center justify-between">

              {/* Logo left */}
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-xl shadow-inner">
                  M
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-[0.2em] text-white/60">Official Pass</p>
                  <p className="text-xs font-semibold text-white/80" style={KU}>مۆزەخانەی ئەمنە سورەکە</p>
                </div>
              </div>

              {/* Pass type right */}
              <div className="text-right">
                <p className="text-[9px] tracking-[0.3em] text-white/50 uppercase mb-0.5" style={KU}>پاسی سەردانکار</p>
                <p className="text-base font-black tracking-[0.25em] uppercase">VISITOR PASS</p>
                <p className="text-[10px] font-mono text-white/60 mt-0.5">REF: {ref}</p>
              </div>

            </div>
          </div>

          {/* ── Thin gold accent ── */}
          <div className="h-1 bg-gradient-to-r from-[#7a0000] via-[#c8a96e] to-[#7a0000]" />

          {/* ── Status banner ── */}
          <div
            className="px-7 py-2.5 flex items-center gap-2.5"
            style={{ background: s.bg, borderBottom: `1px solid ${s.border}33` }}
          >
            <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: s.dot }} />
            <span className="text-xs font-bold" style={{ color: s.color }}>
              <span style={KU}>{s.ku}</span>
              <span className="opacity-60 mx-1.5">·</span>
              {s.en}
            </span>
          </div>

          {/* ── Body: two-column ── */}
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-0">

            {/* Left: details */}
            <div className="px-7 py-6 border-b md:border-b-0 md:border-l border-gray-100">
              <h2 className="text-[10px] font-bold uppercase tracking-[0.25em] text-red-700 mb-3 flex items-center gap-2" style={KU}>
                <span className="w-3 h-px bg-red-600 block" />
                وردەکاری داواکاری
                <span className="opacity-40 font-normal">· Reservation Details</span>
              </h2>

              <Field ku="ناوی تەواو"      en="Full Name"     value={reservation.name} />
              <Field ku="ژمارەی مۆبایل"  en="Phone Number"  value={reservation.phone} mono />
              <Field ku="ژمارەی میوان"   en="Number of Guests" value={`${reservation.guest_count} کەس · ${reservation.guest_count} People`} />
              <Field ku="بەرواری سەردان" en="Visit Date"    value={dateFormatted} mono />
              <Field ku="کاتی سەردان"   en="Visit Time"    value={reservation.time?.slice(0, 5)} mono />
              {reservation.note && <Field ku="تێبینی" en="Note" value={reservation.note} />}
              <Field ku="کاتی تۆمارکردن" en="Submitted" value={submittedAt} mono />
            </div>

            {/* Right: QR */}
            <div className="flex flex-col items-center justify-center gap-3 px-7 py-6 bg-gray-50/60">
              <div className="bg-white rounded-2xl p-4 shadow-md border border-gray-100">
                <QRCodeSVG
                  value={qrUrl || `${typeof window !== 'undefined' ? window.location.href : ''}`}
                  size={148}
                  bgColor="#ffffff"
                  fgColor="#1a1a1a"
                  level="H"
                  includeMargin={false}
                />
              </div>
              <div className="text-center">
                <p className="text-[9px] uppercase tracking-widest text-gray-400 mb-0.5" style={KU}>بخوێنەرەوە بۆ پشتڕاستکردنەوە</p>
                <p className="text-[9px] uppercase tracking-widest text-gray-300">SCAN TO VERIFY</p>
                <p className="font-mono text-xs font-black text-red-700 mt-1.5 tracking-widest" style={{ fontFamily: "'Courier New', Courier, monospace" }}>
                  RESERVATION · {ref}
                </p>
              </div>
            </div>

          </div>

          {/* ── Ticket tear line ── */}
          <div className="relative flex items-center px-4 my-0">
            <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 -ml-2.5 border border-gray-200" />
            <div className="flex-1 border-t-2 border-dashed border-gray-200 mx-1" />
            <div className="w-5 h-5 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex-shrink-0 -mr-2.5 border border-gray-200" />
          </div>

          {/* ── Footer ── */}
          <div className="px-7 py-4 flex items-center justify-between bg-gray-50">
            <div dir="rtl">
              <p className="text-xs font-semibold text-gray-700" style={KU}>مۆزەخانەی نیشتمانی ئەمنە سورەکە</p>
              <p className="text-[10px] text-gray-400 mt-0.5">Amna Suraka National Museum · Sulaymaniyah, Kurdistan</p>
              <p className="text-[10px] text-gray-300 mt-0.5" style={KU}>ئەم پاسە پێشکەش بکە کاتێک دەگەیتە مۆزەخانەکە</p>
            </div>
            <button
              onClick={() => window.print()}
              className="no-print flex items-center gap-2 text-xs bg-[#7a0000] hover:bg-[#a00000] text-white px-4 py-2 rounded-xl transition-colors font-semibold shadow-sm flex-shrink-0 ml-4"
              style={KU}
            >
              🖨 چاپکردن
            </button>
          </div>

        </div>

        {/* Back link */}
        <div className="no-print text-center mt-6">
          <Link href="/kurdish" className="text-xs text-gray-400 hover:text-gray-600 transition-colors" style={KU}>
            ← بگەڕێوە بۆ ماڵپەڕ
          </Link>
        </div>

      </div>
    </>
  )
}
