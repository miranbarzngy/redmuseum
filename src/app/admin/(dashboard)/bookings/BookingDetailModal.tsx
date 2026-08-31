"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { X, Phone, ScanFace, Users, Tag, CalendarDays, Clock3, Hash, Loader2, Trash2, Printer } from "lucide-react";
import { deleteBooking, getFacePhotoUrl } from "./actions";
import { openBookingPrint } from "./bookingPrint";
import { formatVisitDate, formatSubmittedAt } from "./formatBookingDate";
import { StatusSelect } from "./StatusSelect";
import { VISITOR_TYPE_LABELS } from "./visitorType";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { StatusBadge, BOOKING_STATUS_TONE } from "../../_components/StatusBadge";
import { STATUS_LABELS } from "./status";
import { BookingQr } from "@/components/BookingQr";
import type { BookingRow } from "@/lib/supabase/database.types";

function InfoRow({ icon: Icon, label, value, ltr = false }: {
  icon: typeof Users;
  label: string;
  value: React.ReactNode;
  ltr?: boolean;
}) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-ink/5 py-3 last:border-0">
      <dt className="font-kurdish flex shrink-0 items-center gap-2 text-fluid-xs font-medium text-ink-faint">
        <Icon size={14} />
        {label}
      </dt>
      <dd className="font-kurdish text-end text-fluid-sm text-ink" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

export function BookingDetailModal({ booking, onClose }: { booking: BookingRow; onClose: () => void }) {
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  useEffect(() => {
    let active = true;
    if (booking.face_image_path) {
      getFacePhotoUrl(booking.face_image_path)
        .then((url) => {
          if (active) setFacePhotoUrl(url);
        })
        .catch(() => {});
    }
    return () => {
      active = false;
    };
  }, [booking.face_image_path]);

  return (
    <>
    <div
      className="fixed inset-0 z-[70] flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={booking.name}
        className="w-full max-w-lg rounded-2xl border border-ink/10 bg-white shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-ink/10 px-6 py-4">
          <div className="min-w-0">
            <h2 className="font-kurdish truncate text-fluid-lg font-semibold text-ink">{booking.name}</h2>
            <div className="mt-1.5">
              <StatusBadge tone={BOOKING_STATUS_TONE[booking.status]}>
                {STATUS_LABELS[booking.status]}
              </StatusBadge>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="داخستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-ink/30 hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>

        <div className="flex flex-col gap-6 px-6 py-5">
          {/* Status control */}
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">گۆڕینی دۆخ:</span>
            <StatusSelect id={booking.id} status={booking.status} />
          </div>

          {/* Details */}
          <dl className="rounded-xl border border-ink/10 bg-canvas-soft/40 px-4">
            <InfoRow
              icon={Phone}
              label="ژمارەی مۆبایل"
              value={
                <a href={`tel:${booking.phone}`} className="text-pigment-terracotta hover:underline">
                  {booking.phone}
                </a>
              }
              ltr
            />
            <InfoRow icon={Users} label="ژمارەی میوان" value={booking.guest_count} />
            <InfoRow icon={Tag} label="جۆری سەردان" value={VISITOR_TYPE_LABELS[booking.visitor_type]} />
            <InfoRow icon={CalendarDays} label="بەرواری سەردان" value={<span dir="ltr">{formatVisitDate(booking.visit_date)}</span>} />
            <InfoRow icon={Hash} label="ژمارەی سەردان" value={<span dir="ltr">{booking.public_token.slice(0, 8).toUpperCase()}</span>} />
            <InfoRow icon={Clock3} label="نێردراوە لە" value={<span dir="ltr">{formatSubmittedAt(booking.created_at)}</span>} />
          </dl>

          {booking.note && (
            <div>
              <p className="font-kurdish mb-1.5 text-fluid-xs font-medium text-ink-soft">تێبینی</p>
              <p className="font-kurdish whitespace-pre-wrap rounded-xl border border-ink/10 bg-canvas-soft/40 px-4 py-3 text-fluid-sm leading-relaxed text-ink">
                {booking.note}
              </p>
            </div>
          )}

          {booking.face_image_path && (
            <div className="flex items-center gap-4 rounded-xl border border-ink/10 bg-canvas-soft/40 px-4 py-3">
              {facePhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={facePhotoUrl} alt="" className="h-20 w-20 shrink-0 rounded-xl border border-ink/10 object-cover" />
              ) : (
                <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-ink/5" />
              )}
              <div className="font-kurdish flex items-center gap-2 text-fluid-xs text-pigment-teal">
                <ScanFace size={15} />
                ڕوخساری میوانەکە لە کاتی داواکاریدا تۆمارکراوە.
              </div>
            </div>
          )}

          {/* QR to the public status page */}
          <div className="flex flex-col items-center gap-3 rounded-xl border border-ink/10 bg-canvas-soft/40 px-4 py-5 text-center sm:flex-row sm:text-start">
            <BookingQr path={`/ku/booking/${booking.public_token}`} size={116} />
            <div className="font-kurdish flex flex-col gap-1 text-fluid-xs text-ink-soft">
              <span className="font-medium text-ink">کۆدی QRی سەردان</span>
              <span>میوان لە کاتی هاتندا ئەمە پیشان دەدات بۆ بینینی دۆخی سەردان.</span>
              <a
                href={`/ku/booking/${booking.public_token}`}
                target="_blank"
                rel="noreferrer"
                dir="ltr"
                className="mt-0.5 w-fit text-pigment-terracotta hover:underline"
              >
                /ku/booking/{booking.public_token.slice(0, 12)}…
              </a>
            </div>
          </div>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-6 py-4">
          <div className="flex flex-wrap items-center gap-3">
            <a
              href={`tel:${booking.phone}`}
              className="font-kurdish inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
            >
              <Phone size={15} /> پەیوەندیکردن
            </a>
            <button
              type="button"
              onClick={() => openBookingPrint(booking, facePhotoUrl)}
              className="font-kurdish inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-[#850B10] hover:text-[#850B10]"
            >
              <Printer size={15} /> چاپکردن
            </button>
          </div>
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            disabled={deleting}
            className="font-kurdish inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-fluid-sm font-medium text-ink-faint transition-colors hover:border-pigment-crimson hover:text-pigment-crimson disabled:opacity-50"
          >
            {deleting ? <Loader2 size={15} className="animate-spin" /> : <Trash2 size={15} />}
            سڕینەوە
          </button>
        </div>
      </div>
    </div>

    <ConfirmDialog
      open={confirmOpen}
      message="ئەم سەردانە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
      onCancel={() => setConfirmOpen(false)}
      onConfirm={() => {
        setConfirmOpen(false);
        startDelete(async () => {
          await deleteBooking(booking.id);
          onClose();
        });
      }}
    />
    </>
  );
}
