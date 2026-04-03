'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { QRCodeSVG } from 'qrcode.react'
import Link from 'next/link'

const STATUS_COLORS = {
  pending:  { bg: 'bg-yellow-500/20', text: 'text-yellow-400', border: 'border-yellow-500/30', label: 'Pending / چاوەڕوانکراو' },
  approved: { bg: 'bg-blue-500/20',   text: 'text-blue-400',   border: 'border-blue-500/30',   label: 'Approved / پەسەندکراو' },
  visited:  { bg: 'bg-green-500/20',  text: 'text-green-400',  border: 'border-green-500/30',  label: 'Visited / سەردانکراو' },
}

export default function ReservationPage() {
  const { id } = useParams()
  const [reservation, setReservation] = useState(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    if (!id) return
    fetch(`/api/reservation/${id}`)
      .then(r => r.json())
      .then(json => {
        if (json.data) setReservation(json.data)
        else setNotFound(true)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-red-600 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center px-4">
        <div className="text-center">
          <i className="ri-error-warning-line text-6xl text-red-500 mb-4 block" />
          <h1 className="text-2xl font-bold mb-2">Reservation Not Found</h1>
          <p className="text-gray-400 mb-6">ناسنامەی داواکاری دۆزرایەوە نا</p>
          <Link href="/kurdish" className="px-6 py-3 bg-red-600 hover:bg-red-500 rounded-lg text-sm font-semibold transition-colors">
            Go Home
          </Link>
        </div>
      </div>
    )
  }

  const status = STATUS_COLORS[reservation.status] || STATUS_COLORS.pending
  const qrUrl = typeof window !== 'undefined' ? window.location.href : ''

  const fields = [
    { label: 'Full Name / ناوی تەواو',       value: reservation.name },
    { label: 'Guests / ژمارەی میوان',        value: reservation.guest_count },
    { label: 'Phone / تەلەفۆن',             value: reservation.phone },
    { label: 'Date / بەروار',               value: reservation.date },
    { label: 'Time / کات',                  value: reservation.time?.slice(0, 5) },
    { label: 'Reservation ID / ناسنامە',    value: reservation.id.slice(0, 8).toUpperCase() },
    { label: 'Submitted / کاتی تۆمارکردن', value: new Date(reservation.created_at).toLocaleString() },
  ]

  if (reservation.note) {
    fields.push({ label: 'Note / تێبینی', value: reservation.note })
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white px-4 py-12">
      <div className="max-w-lg mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-red-600/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-ticket-2-line text-red-400 text-3xl" />
          </div>
          <h1 className="text-2xl font-black mb-1">Visitor Reservation</h1>
          <p className="text-gray-400 text-sm">داواکاری سەردانکردن</p>
        </div>

        {/* Status Badge */}
        <div className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border mb-6 ${status.bg} ${status.border}`}>
          <span className={`text-sm font-semibold ${status.text}`}>{status.label}</span>
        </div>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="bg-white rounded-2xl p-5 shadow-2xl">
            <QRCodeSVG
              value={qrUrl}
              size={180}
              bgColor="#ffffff"
              fgColor="#0a0a0a"
              level="H"
            />
          </div>
        </div>

        {/* Details Card */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
          {fields.map(({ label, value }) => (
            <div key={label} className="flex justify-between gap-4 items-start">
              <span className="text-gray-400 text-sm shrink-0">{label}</span>
              <span className="text-white font-medium text-sm text-right">{value}</span>
            </div>
          ))}
        </div>

        {/* Museum branding */}
        <div className="text-center mt-8 text-gray-600 text-xs">
          <p>Amna Suraka National Museum</p>
          <p className="mt-1">مۆزەخانەی نیشتمانی ئەمنە سورەکە</p>
        </div>

      </div>
    </div>
  )
}
