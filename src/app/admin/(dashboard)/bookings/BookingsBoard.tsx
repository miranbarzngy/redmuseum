"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Ticket, Phone, CalendarDays, Clock3, Users } from "lucide-react";
import clsx from "clsx";
import { updateBookingStatus, getFacePhotoUrl, logBookingPrinted } from "./actions";
import { openBookingPrint } from "./bookingPrint";
import { formatVisitDate, formatVisitWeekdayAndTime } from "./formatBookingDate";
import { StatusPill } from "./StatusPill";
import { BookingAvatar } from "./BookingAvatar";
import { BookingActions, type TargetStatus } from "./BookingActions";
import { BookingStatCards, type BookingFilter } from "./BookingStatCards";
import { BookingToolbar, type DateRange } from "./BookingToolbar";
import { BookingDrawer } from "./BookingDrawer";
import { BookingPhotoLightbox } from "./BookingPhotoLightbox";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { EmptyState } from "../../_components/EmptyState";
import type { BookingRow, BookingStatus, BookingVisitorTypeRow } from "@/lib/supabase/database.types";

const CONFIRM_MESSAGE: Record<TargetStatus, string> = {
  confirmed: "ئەم داواکاریی سەردانە پەسەند بکرێت؟",
  cancelled: "ئەم داواکاریی سەردانە ڕەت بکرێتەوە؟",
  checked_in: "دیاری بکرێت کە میوانەکە هاتووە؟",
  no_show: "دیاری بکرێت کە میوانەکە نەهاتووە؟",
};
const DANGER_STATUS = new Set<TargetStatus>(["cancelled", "no_show"]);

/** `visit_date` is a plain "YYYY-MM-DD". The period filters look forward
 * only: "today" is today's visits, "week" is today → end of this
 * (Saturday-started) week, "month" is today → end of this month. Past
 * bookings show only under "all". */
function inRange(visitDate: string, range: DateRange): boolean {
  if (range === "all" || range === "custom") return true;
  const [y, m, d] = visitDate.split("-").map(Number);
  const vd = new Date(y, m - 1, d);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (vd < today) return false;
  if (range === "today") return vd.getTime() === today.getTime();

  if (range === "month") {
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return vd <= endOfMonth;
  }

  // week: today through the end (Friday) of the Saturday-started week.
  const endOfWeek = new Date(today);
  endOfWeek.setDate(today.getDate() + (6 - ((today.getDay() + 1) % 7)));
  return vd <= endOfWeek;
}

function matchesQuery(b: BookingRow, needle: string): boolean {
  if (!needle) return true;
  if (b.name.toLowerCase().includes(needle)) return true;
  if (b.phone.includes(needle)) return true;
  const digits = needle.replace(/\D/g, "");
  return digits.length > 0 && b.phone.replace(/\D/g, "").includes(digits);
}

function printBooking(b: BookingRow, visitorTypeLabel: string) {
  // Kick off the signed-URL fetch here (sync) and hand the promise to
  // openBookingPrint, which opens its window before awaiting it.
  openBookingPrint(b, visitorTypeLabel, b.face_image_path ? getFacePhotoUrl(b.face_image_path) : null);
  logBookingPrinted(b.id).catch(() => {});
}

export function BookingsBoard({
  bookings,
  visitorTypes,
  facePhotoUrls,
  initialViewId = null,
}: {
  bookings: BookingRow[];
  visitorTypes: BookingVisitorTypeRow[];
  facePhotoUrls: Record<string, string>;
  initialViewId?: string | null;
}) {
  const [filter, setFilter] = useState<BookingFilter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState<string | null>(
    initialViewId && bookings.some((b) => b.id === initialViewId) ? initialViewId : null
  );
  const [busyId, setBusyId] = useState<string | null>(null);
  const [showOverdueOnly, setShowOverdueOnly] = useState(false);
  const [confirmTask, setConfirmTask] = useState<{ id: string; name: string; status: TargetStatus } | null>(null);
  const [lightboxPhoto, setLightboxPhoto] = useState<{ url: string; name: string } | null>(null);
  const [, startStatusChange] = useTransition();

  const todayISO = new Date().toISOString().split("T")[0];

  function changeStatus(id: string, status: BookingStatus) {
    setBusyId(id);
    startStatusChange(() => {
      updateBookingStatus(id, status)
        .catch(() => {})
        .finally(() => setBusyId(null));
    });
  }

  const dateScoped = useMemo(() => {
    if (dateRange === "custom") {
      return bookings.filter((b) => {
        if (customFrom && b.visit_date < customFrom) return false;
        if (customTo && b.visit_date > customTo) return false;
        return true;
      });
    }
    return bookings.filter((b) => inRange(b.visit_date, dateRange));
  }, [bookings, dateRange, customFrom, customTo]);

  function pickStatus(key: BookingFilter) {
    setShowOverdueOnly(false);
    setFilter(key);
  }

  // Two numbers per status: how many bookings, and how many people (sum of
  // guest_count). Both scoped to the active date filter only — search
  // narrows the visible list further without changing these totals.
  const counts = useMemo(() => {
    const empty = (): Record<BookingFilter, number> => ({
      all: 0,
      pending: 0,
      confirmed: 0,
      checked_in: 0,
      cancelled: 0,
      no_show: 0,
    });
    const rows = empty();
    const people = empty();
    for (const b of dateScoped) {
      rows[b.status] += 1;
      people[b.status] += b.guest_count;
      rows.all += 1;
      people.all += b.guest_count;
    }
    return { rows, people };
  }, [dateScoped]);

  // Confirmed, visit date already passed, still not marked هاتووە/نەهاتووە.
  const overdue = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" && b.visit_date < todayISO),
    [bookings, todayISO]
  );

  const needle = query.trim().toLowerCase();
  const visible = useMemo(() => {
    if (showOverdueOnly) return overdue;
    const statusScoped = filter === "all" ? dateScoped : dateScoped.filter((b) => b.status === filter);
    return needle ? statusScoped.filter((b) => matchesQuery(b, needle)) : statusScoped;
  }, [showOverdueOnly, overdue, filter, dateScoped, needle]);

  const openBooking = openId ? bookings.find((b) => b.id === openId) ?? null : null;

  const labelById = useMemo(
    () => new Map(visitorTypes.map((vt) => [vt.id, vt.label_ku])),
    [visitorTypes]
  );
  const visitorTypeLabel = (b: BookingRow) => labelById.get(b.visitor_type_id) ?? "—";

  return (
    <div className="flex flex-col gap-5">
      <BookingStatCards counts={counts} filter={showOverdueOnly ? "all" : filter} onSelect={pickStatus} />

      <BookingToolbar
        query={query}
        onQueryChange={setQuery}
        dateRange={dateRange}
        onDateRangeChange={(v) => {
          setDateRange(v);
          if (v !== "custom") {
            setCustomFrom("");
            setCustomTo("");
          }
          setShowOverdueOnly(false);
        }}
        customFrom={customFrom}
        onCustomFromChange={setCustomFrom}
        customTo={customTo}
        onCustomToChange={setCustomTo}
      />

      {/* "You forgot to mark a visit" nudge — mirrors the daily APK push. */}
      {overdue.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-pigment-gold/30 bg-pigment-gold/10 px-4 py-3">
          <span className="font-kurdish flex items-center gap-2 text-fluid-xs text-[#8a6d1f]">
            <AlertTriangle size={15} className="shrink-0" />
            {overdue.length} سەردانی پشتڕاستکراو تێپەڕیوە و هێشتا نەشیکراوەتەوە — دیاری بکە هاتوون یان نەهاتوون.
          </span>
          <button
            type="button"
            onClick={() => setShowOverdueOnly((v) => !v)}
            className="font-kurdish shrink-0 rounded-full bg-[#8a6d1f] px-3 py-1.5 text-fluid-xs font-medium text-canvas transition-opacity hover:opacity-90"
          >
            {showOverdueOnly ? "گەڕانەوە" : "پیشاندان"}
          </button>
        </div>
      )}

      {filter !== "all" && !showOverdueOnly && (
        <button
          type="button"
          onClick={() => setFilter("all")}
          className="font-kurdish w-fit text-fluid-xs font-medium text-pigment-terracotta hover:underline"
        >
          پیشاندانی هەموو دۆخەکان
        </button>
      )}

      {visible.length === 0 ? (
        <EmptyState
          icon={Ticket}
          title={bookings.length === 0 ? "هێشتا هیچ سەردانێک نییە" : "هیچ سەردانێک بەم فلتەرە نییە"}
        />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {visible.map((b) => (
            <div
              key={b.id}
              className={clsx(
                "flex overflow-hidden rounded-2xl border-2 bg-white shadow-card",
                b.status === "pending"
                  ? "border-[#850B10] shadow-[0_0_16px_-2px_rgba(133,11,16,0.45)] bg-[#850B10]/[0.04]"
                  : "border-ink/10"
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setOpenId(b.id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setOpenId(b.id);
                  }
                }}
                aria-label={b.name}
                className="ms-3 mt-3 h-40 w-40 shrink-0 cursor-pointer"
              >
                <BookingAvatar
                  name={b.name}
                  pending={b.status === "pending"}
                  photoUrl={b.face_image_path ? facePhotoUrls[b.face_image_path] : null}
                  shape="square"
                  onViewPhoto={
                    b.face_image_path && facePhotoUrls[b.face_image_path]
                      ? () => setLightboxPhoto({ url: facePhotoUrls[b.face_image_path!], name: b.name })
                      : undefined
                  }
                />
              </div>

              <div className="flex min-w-0 flex-1 flex-col p-4">
                <div className="flex items-start gap-3">
                  <button type="button" onClick={() => setOpenId(b.id)} className="flex-1 min-w-0 text-start">
                    <span className="block truncate font-semibold text-ink">{b.name}</span>
                    <span className="block truncate text-fluid-xs font-bold text-ink-faint">
                      <span dir="ltr" className="inline-flex items-center gap-1">
                        <Phone size={12} className="shrink-0" />
                        {b.phone}
                      </span>
                    </span>
                  </button>

                  <div className="flex shrink-0 flex-col items-center gap-0.5 text-center">
                    <span className="flex items-center gap-1.5 text-fluid-sm font-bold text-ink">
                      <Clock3 size={14} className="shrink-0" />
                      {formatVisitWeekdayAndTime(b.visit_date, b.visit_time)}
                    </span>
                    <span dir="ltr" className="inline-flex items-center gap-1 text-[11px] text-ink-faint">
                      <CalendarDays size={11} className="shrink-0" />
                      {formatVisitDate(b.visit_date)}
                    </span>
                  </div>

                  <div className="flex flex-1 justify-end">
                    <StatusPill status={b.status} />
                  </div>
                </div>

                <div className="my-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-ink/5 py-2.5 text-fluid-xs text-ink-soft">
                  <span>{visitorTypeLabel(b)}</span>
                  <span className="flex items-center gap-1 text-ink-faint">
                    <Users size={13} className="shrink-0" />
                    {b.guest_count} کەس
                  </span>
                </div>

                <BookingActions
                  booking={b}
                  busy={busyId === b.id}
                  onRequestStatus={(status) => setConfirmTask({ id: b.id, name: b.name, status })}
                  onView={() => setOpenId(b.id)}
                  onPrint={() => printBooking(b, visitorTypeLabel(b))}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      <BookingDrawer
        booking={openBooking}
        visitorTypeLabel={openBooking ? visitorTypeLabel(openBooking) : ""}
        onClose={() => setOpenId(null)}
      />

      {lightboxPhoto && (
        <BookingPhotoLightbox
          url={lightboxPhoto.url}
          name={lightboxPhoto.name}
          onClose={() => setLightboxPhoto(null)}
        />
      )}

      <ConfirmDialog
        open={!!confirmTask}
        name={confirmTask?.name}
        message={confirmTask ? CONFIRM_MESSAGE[confirmTask.status] : ""}
        confirmLabel="دڵنیام"
        danger={confirmTask ? DANGER_STATUS.has(confirmTask.status) : false}
        onCancel={() => setConfirmTask(null)}
        onConfirm={() => {
          if (confirmTask) changeStatus(confirmTask.id, confirmTask.status);
          setConfirmTask(null);
        }}
      />
    </div>
  );
}
