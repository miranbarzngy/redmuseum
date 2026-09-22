"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import {
  Phone,
  MessageCircle,
  ScanFace,
  Users,
  Tag,
  CalendarDays,
  Clock3,
  Hash,
  Copy,
  Loader2,
  Trash2,
  Printer,
  X,
} from "lucide-react";
import { deleteBooking, getFacePhotoUrl, logBookingPrinted } from "./actions";
import { openBookingPrint } from "./bookingPrint";
import { formatVisitDate, formatSubmittedAt } from "./formatBookingDate";
import { StatusSelect } from "./StatusSelect";
import { BookingAvatar } from "./BookingAvatar";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";
import { toWhatsAppLink } from "../../_components/whatsapp";
import { BookingQr } from "@/components/BookingQr";
import type { BookingRow } from "@/lib/supabase/database.types";

function InfoRow({
  icon: Icon,
  label,
  value,
  ltr = false,
}: {
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

/** Right-edge visitor detail drawer, opened from a table row or card.
 * Mirrors messages/MessageDrawer's shell (overlay + slide-in panel) so the
 * two inbox-style admin pages feel like one system. Keyed by booking.id in
 * the inner panel so switching straight from one open booking to another
 * remounts fresh state (face photo, confirm dialog) instead of needing a
 * manual reset inside an effect. */
export function BookingDrawer({
  booking,
  visitorTypeLabel,
  onClose,
}: {
  booking: BookingRow | null;
  visitorTypeLabel: string;
  onClose: () => void;
}) {
  if (!booking) return null;
  return (
    <BookingDrawerPanel key={booking.id} booking={booking} visitorTypeLabel={visitorTypeLabel} onClose={onClose} />
  );
}

function BookingDrawerPanel({
  booking,
  visitorTypeLabel,
  onClose,
}: {
  booking: BookingRow;
  visitorTypeLabel: string;
  onClose: () => void;
}) {
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const statusPath = `/ku/booking/${booking.public_token}`;

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

  async function handleCopyLink() {
    try {
      await navigator.clipboard.writeText(`${window.location.origin}${statusPath}`);
      toast.show("لینک کۆپی کرا.");
    } catch {
      toast.show("نەتوانرا لینکەکە کۆپی بکرێت.", "error");
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[70]" onClick={onClose}>
        <div className="absolute inset-0 animate-overlay-in bg-ink/40 backdrop-blur-sm" />

        <div
          dir="rtl"
          role="dialog"
          aria-modal="true"
          aria-label={booking.name}
          onClick={(e) => e.stopPropagation()}
          className="animate-drawer-in-left absolute inset-y-0 left-0 flex w-full max-w-md flex-col border-s border-ink/10 bg-white shadow-soft"
        >
          {/* Header — avatar, name, and the status select doubling as the
              header's colour-coded badge for a one-click status change. */}
          <div className="flex items-start justify-between gap-3 border-b border-ink/10 px-5 py-4">
            <div className="flex min-w-0 items-center gap-3">
              <BookingAvatar name={booking.name} pending={booking.status === "pending"} size="lg" />
              <div className="min-w-0">
                <p className="font-kurdish truncate text-fluid-base font-semibold text-ink">{booking.name}</p>
                <div className="mt-1.5">
                  <StatusSelect id={booking.id} status={booking.status} />
                </div>
              </div>
            </div>
            <button
              ref={closeRef}
              type="button"
              onClick={onClose}
              aria-label="داخستن"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink"
            >
              <X size={17} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5">
            <div className="flex flex-col gap-6">
              {/* Visitor info */}
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
                <InfoRow icon={Tag} label="جۆری سەردان" value={visitorTypeLabel} />
                <InfoRow
                  icon={CalendarDays}
                  label="بەرواری سەردان"
                  value={<span dir="ltr">{formatVisitDate(booking.visit_date)}</span>}
                />
                <InfoRow
                  icon={Hash}
                  label="ژمارەی سەردان"
                  value={
                    <span
                      dir="ltr"
                      className="rounded-md bg-canvas-paper px-1.5 py-0.5 font-mono text-fluid-xs tracking-wider text-ink"
                    >
                      {booking.public_token.slice(0, 8).toUpperCase()}
                    </span>
                  }
                />
                <InfoRow
                  icon={Clock3}
                  label="نێردراوە لە"
                  value={<span dir="ltr">{formatSubmittedAt(booking.created_at)}</span>}
                />
              </dl>

              {/* Notes — a visually distinct card so remarks don't blend
                  into the plain key/value rows above. */}
              {booking.note && (
                <div>
                  <p className="font-kurdish mb-1.5 text-fluid-xs font-medium text-ink-soft">تێبینی</p>
                  <p className="font-kurdish whitespace-pre-wrap rounded-xl border-s-4 border-pigment-gold/40 bg-canvas-soft/40 px-4 py-3 text-fluid-sm leading-relaxed text-ink">
                    {booking.note}
                  </p>
                </div>
              )}

              {booking.face_image_path && (
                <div className="flex items-center gap-4 rounded-xl border border-ink/10 bg-canvas-soft/40 px-4 py-3">
                  {facePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={facePhotoUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl border border-ink/10 object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-ink/5" />
                  )}
                  <div className="font-kurdish flex items-center gap-2 text-fluid-xs text-pigment-teal">
                    <ScanFace size={15} />
                    ڕوخساری میوانەکە لە کاتی داواکاریدا تۆمارکراوە.
                  </div>
                </div>
              )}

              {/* QR verification card */}
              <div className="flex flex-col items-center gap-4 rounded-2xl border border-ink/10 bg-canvas-soft/40 px-4 py-5 text-center">
                <div className="rounded-xl bg-white p-3 shadow-card ring-1 ring-ink/5">
                  <BookingQr path={statusPath} size={128} />
                </div>

                <p className="font-kurdish max-w-[26rem] text-fluid-xs leading-relaxed text-ink-soft">
                  میوان لە کاتی هاتندا ئەم کۆدە پیشان دەدات بۆ پشتڕاستکردنەوەی سەردان.
                </p>

                <div className="flex w-full max-w-full items-center gap-1.5 rounded-full border border-ink/10 bg-white py-1 ps-3 pe-1">
                  <a
                    href={statusPath}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="min-w-0 flex-1 truncate text-start font-mono text-fluid-xs text-ink-soft hover:text-pigment-terracotta hover:underline"
                  >
                    {`${statusPath.slice(0, 20)}…`}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    aria-label="کۆپیکردنی لینک"
                    className="font-kurdish inline-flex shrink-0 items-center gap-1 rounded-full bg-canvas-paper px-3 py-1.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:bg-ink/10 hover:text-ink"
                  >
                    <Copy size={12} /> کۆپی
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Footer — call/whatsapp primary, print secondary, delete pushed
              to the opposite edge with its own confirm state. */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-ink/10 px-5 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <a
                href={`tel:${booking.phone}`}
                className="font-kurdish inline-flex items-center gap-1.5 rounded-full bg-[#850B10] px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
              >
                <Phone size={15} /> پەیوەندی
              </a>
              <a
                href={toWhatsAppLink(booking.phone)}
                target="_blank"
                rel="noopener noreferrer"
                className="font-kurdish inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-emerald-700"
              >
                <MessageCircle size={15} /> واتساپ
              </a>
              <button
                type="button"
                onClick={() => {
                  openBookingPrint(booking, visitorTypeLabel, facePhotoUrl);
                  logBookingPrinted(booking.id).catch(() => {});
                }}
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
