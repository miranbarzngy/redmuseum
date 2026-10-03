"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import clsx from "clsx";
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
  Send,
  X,
} from "lucide-react";
import { deleteBooking, getFacePhotoUrl, logBookingPrinted } from "./actions";
import { openBookingPrint } from "./bookingPrint";
import { formatVisitDate, formatSubmittedAt } from "./formatBookingDate";
import { StatusSelect } from "./StatusSelect";
import { BookingAvatar } from "./BookingAvatar";
import { Sheet } from "../../_components/Sheet";
import { btnDanger, btnPrimary, btnSecondary, btnWhatsApp } from "../../_components/Button";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";
import { toWhatsAppLink } from "../../_components/whatsapp";
import { BookingQr } from "@/components/BookingQr";
import type { BookingRow } from "@/lib/supabase/database.types";

/** iOS-style inset group: a white rounded section on the sheet's frosted
 * background, rows split by hairlines, with an optional small header. */
function InsetGroup({
  title,
  accent,
  className,
  children,
}: {
  title?: string;
  /** Gold dot before the title — marks the visitor's own note. */
  accent?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-1.5">
      {title && (
        <h3 className="font-kurdish flex items-center gap-1.5 px-4 text-[11px] font-medium text-ink-faint">
          {accent && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-gold" />}
          {title}
        </h3>
      )}
      <div
        className={clsx(
          "rounded-2xl bg-white shadow-[0_1px_2px_rgba(28,27,25,0.04)] ring-1 ring-ink/[0.04]",
          className
        )}
      >
        {children}
      </div>
    </section>
  );
}

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
    <div className="flex items-center justify-between gap-6 py-3">
      <dt className="font-kurdish flex shrink-0 items-center gap-2.5 text-fluid-xs font-medium text-ink-faint">
        {/* iOS settings-style icon tile */}
        <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/[0.08] text-brand">
          <Icon size={14} />
        </span>
        {label}
      </dt>
      <dd className="font-kurdish text-end text-fluid-sm text-ink" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

/** Visitor detail sheet, opened from a booking card: an iOS-style frosted
 * sheet (bottom sheet on phones — swipe down to dismiss — and a centred card
 * from `sm` up) with the details in white inset groups. Keyed by booking.id
 * in the inner panel so switching straight from one open booking to another
 * remounts fresh state (face photo, confirm dialog) instead of needing a
 * manual reset inside an effect. */
export function BookingDrawer({
  booking,
  visitorTypeLabel,
  onSendWhatsApp,
  onClose,
}: {
  booking: BookingRow | null;
  visitorTypeLabel: string;
  /** Opens the WhatsApp message picker; omitted when there's nothing to send. */
  onSendWhatsApp?: () => void;
  onClose: () => void;
}) {
  if (!booking) return null;
  return (
    <BookingDrawerPanel
      key={booking.id}
      booking={booking}
      visitorTypeLabel={visitorTypeLabel}
      onSendWhatsApp={onSendWhatsApp}
      onClose={onClose}
    />
  );
}

function BookingDrawerPanel({
  booking,
  visitorTypeLabel,
  onSendWhatsApp,
  onClose,
}: {
  booking: BookingRow;
  visitorTypeLabel: string;
  onSendWhatsApp?: () => void;
  onClose: () => void;
}) {
  const [facePhotoUrl, setFacePhotoUrl] = useState<string | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, startDelete] = useTransition();
  const closeRef = useRef<HTMLButtonElement>(null);
  const toast = useToast();
  const statusPath = `/ku/booking/${booking.public_token}`;

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
      {/* Sheet handles the overlay, Escape, swipe-to-dismiss, focus and the
          page scroll lock. z-[70] keeps the WhatsApp picker, the delete
          confirm (both z-[85]) and the photo lightbox above it. */}
      <Sheet
        open
        onClose={onClose}
        label={booking.name}
        surface="glass"
        widthClassName="sm:max-w-lg"
        initialFocusRef={closeRef}
        zIndexClassName="z-[70]"
      >
        <div dir="rtl" className="flex min-h-0 flex-1 flex-col">
          {/* Header — avatar, name, and the status select doubling as the
              header's colour-coded badge for a one-click status change. */}
          <div className="flex items-start justify-between gap-3 px-5 pb-4 pt-1 sm:pt-5">
            <div className="flex min-w-0 items-center gap-3">
              <BookingAvatar
                name={booking.name}
                pending={booking.status === "pending"}
                photoUrl={facePhotoUrl}
                size="lg"
              />
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
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-ink/[0.06] text-ink-soft transition-[background-color,transform] duration-200 ease-spring hover:bg-ink/10 hover:text-ink active:scale-90"
            >
              <X size={17} />
            </button>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 pb-5 sm:px-5">
            <div className="flex flex-col gap-5">
              <InsetGroup title="زانیاری سەردان">
                <dl className="divide-y divide-ink/[0.06] px-4 py-1">
                  <InfoRow
                    icon={Phone}
                    label="ژمارەی مۆبایل"
                    value={
                      <a href={`tel:${booking.phone}`} className="text-brand hover:underline">
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
                    icon={Clock3}
                    label="کاتژمێری سەردان"
                    value={<span dir="ltr">{booking.visit_time ?? "—"}</span>}
                  />
                  <InfoRow
                    icon={Hash}
                    label="ژمارەی سەردان"
                    value={
                      <span
                        dir="ltr"
                        className="rounded-md bg-ink/[0.05] px-1.5 py-0.5 font-mono text-fluid-xs tracking-wider text-ink"
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
              </InsetGroup>

              {booking.note && (
                <InsetGroup title="تێبینی" accent className="px-4 py-3">
                  <p className="font-kurdish whitespace-pre-wrap text-fluid-sm leading-relaxed text-ink">
                    {booking.note}
                  </p>
                </InsetGroup>
              )}

              {booking.face_image_path && (
                <InsetGroup title="ڕوخسار" className="flex items-center gap-4 px-4 py-3">
                  {facePhotoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={facePhotoUrl}
                      alt=""
                      className="h-20 w-20 shrink-0 rounded-xl border border-ink/[0.06] object-cover"
                    />
                  ) : (
                    <div className="h-20 w-20 shrink-0 animate-pulse rounded-xl bg-ink/[0.06]" />
                  )}
                  <div className="font-kurdish flex items-center gap-2 text-fluid-xs text-pigment-teal">
                    <ScanFace size={15} className="shrink-0" />
                    ڕوخساری میوانەکە لە کاتی داواکاریدا تۆمارکراوە.
                  </div>
                </InsetGroup>
              )}

              {/* QR verification */}
              <InsetGroup
                title="پشتڕاستکردنەوە"
                className="flex flex-col items-center gap-4 px-4 py-5 text-center"
              >
                <div className="rounded-xl bg-white p-3 ring-1 ring-ink/[0.06]">
                  <BookingQr path={statusPath} size={128} />
                </div>

                <p className="font-kurdish max-w-[26rem] text-fluid-xs leading-relaxed text-ink-soft">
                  میوان لە کاتی هاتندا ئەم کۆدە پیشان دەدات بۆ پشتڕاستکردنەوەی سەردان.
                </p>

                <div className="flex w-full max-w-full items-center gap-1.5 rounded-full bg-ink/[0.04] py-1 ps-3 pe-1">
                  <a
                    href={statusPath}
                    target="_blank"
                    rel="noreferrer"
                    dir="ltr"
                    className="min-w-0 flex-1 truncate text-start font-mono text-fluid-xs text-ink-soft hover:text-brand hover:underline"
                  >
                    {`${statusPath.slice(0, 20)}…`}
                  </a>
                  <button
                    type="button"
                    onClick={handleCopyLink}
                    aria-label="کۆپیکردنی لینک"
                    className="font-kurdish inline-flex shrink-0 items-center gap-1 rounded-full bg-brand/10 px-3 py-1.5 text-fluid-xs font-medium text-brand transition-[background-color,transform] duration-200 ease-spring hover:bg-brand/15 active:scale-95"
                  >
                    <Copy size={12} /> کۆپی
                  </button>
                </div>
              </InsetGroup>
            </div>
          </div>

          {/* Footer — a 2×2 grid of full-size actions, like a native detail
              screen: call and WhatsApp on top, print and delete (with its own
              confirm step) below, and a full-width row on top for sending one
              of the /admin/whatsapp messages. */}
          <div className="grid grid-cols-2 gap-2.5 border-t border-ink/[0.06] px-5 py-4">
            {onSendWhatsApp && (
              <button type="button" onClick={onSendWhatsApp} className={clsx(btnWhatsApp, "col-span-2")}>
                <Send size={16} /> ناردنی پەیام بە واتساپ
              </button>
            )}
            <a href={`tel:${booking.phone}`} className={btnPrimary}>
              <Phone size={16} /> پەیوەندی
            </a>
            <a
              href={toWhatsAppLink(booking.phone)}
              target="_blank"
              rel="noopener noreferrer"
              className={btnWhatsApp}
            >
              <MessageCircle size={16} /> واتساپ
            </a>
            <button
              type="button"
              onClick={() => {
                openBookingPrint(booking, visitorTypeLabel, facePhotoUrl);
                logBookingPrinted(booking.id).catch(() => {});
              }}
              className={btnSecondary}
            >
              <Printer size={16} /> چاپکردن
            </button>
            <button type="button" onClick={() => setConfirmOpen(true)} disabled={deleting} className={btnDanger}>
              {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
              سڕینەوە
            </button>
          </div>
        </div>
      </Sheet>

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
