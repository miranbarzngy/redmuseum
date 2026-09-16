"use client";

import { useMemo, useState, useTransition } from "react";
import { AlertTriangle, Ticket } from "lucide-react";
import clsx from "clsx";
import { updateBookingStatus, getFacePhotoUrl, logBookingPrinted } from "./actions";
import { openBookingPrint } from "./bookingPrint";
import { formatVisitDate } from "./formatBookingDate";
import { VISITOR_TYPE_LABELS } from "./visitorType";
import { StatusPill } from "./StatusPill";
import { BookingAvatar } from "./BookingAvatar";
import { BookingActions, type TargetStatus } from "./BookingActions";
import { BookingStatCards, type BookingFilter } from "./BookingStatCards";
import { BookingToolbar, type DateRange } from "./BookingToolbar";
import { BookingDrawer } from "./BookingDrawer";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { EmptyState } from "../../_components/EmptyState";
import { DataList, type Column } from "../../_components/DataList";
import type { BookingRow, BookingStatus } from "@/lib/supabase/database.types";

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

function printBooking(b: BookingRow) {
  // Kick off the signed-URL fetch here (sync) and hand the promise to
  // openBookingPrint, which opens its window before awaiting it.
  openBookingPrint(b, b.face_image_path ? getFacePhotoUrl(b.face_image_path) : null);
  logBookingPrinted(b.id).catch(() => {});
}

export function BookingsBoard({
  bookings,
  initialViewId = null,
}: {
  bookings: BookingRow[];
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

  const columns: Column<BookingRow>[] = [
    {
      key: "name",
      header: "میوان",
      cell: (b) => (
        <button type="button" onClick={() => setOpenId(b.id)} className="flex items-center gap-3 text-start">
          <BookingAvatar name={b.name} pending={b.status === "pending"} />
          <span className="min-w-0">
            <span className="block truncate font-medium text-ink transition-colors hover:text-pigment-terracotta">
              {b.name}
            </span>
            <span dir="ltr" className="block truncate text-fluid-xs font-normal text-ink-faint">
              {b.phone}
            </span>
          </span>
        </button>
      ),
    },
    {
      key: "type",
      header: "جۆر",
      className: "w-40",
      cell: (b) => <span className="text-fluid-xs text-ink-soft">{VISITOR_TYPE_LABELS[b.visitor_type]}</span>,
    },
    {
      key: "guests",
      header: "میوانان",
      className: "w-24",
      cell: (b) => <span className="text-fluid-xs text-ink-soft">{b.guest_count} کەس</span>,
    },
    {
      key: "date",
      header: "بەرواری سەردان",
      className: "w-32",
      cell: (b) => (
        <span dir="ltr" className="text-fluid-xs text-ink-soft">
          {formatVisitDate(b.visit_date)}
        </span>
      ),
    },
    {
      key: "status",
      header: "دۆخ",
      className: "w-32",
      cell: (b) => <StatusPill status={b.status} />,
    },
    {
      key: "actions",
      header: "",
      align: "end",
      className: "w-40",
      cell: (b) => (
        <div className="flex items-center justify-end">
          <BookingActions
            booking={b}
            busy={busyId === b.id}
            onRequestStatus={(status) => setConfirmTask({ id: b.id, name: b.name, status })}
            onView={() => setOpenId(b.id)}
            onPrint={() => printBooking(b)}
          />
        </div>
      ),
    },
  ];

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
        <DataList
          rows={visible}
          columns={columns}
          rowKey={(b) => b.id}
          rowClassName={(b) => (b.status === "pending" ? "bg-[#850B10]/[0.04]" : undefined)}
          renderCard={(b) => (
            <div
              className={clsx(
                "flex flex-col rounded-2xl border bg-white p-4 shadow-card",
                b.status === "pending"
                  ? "border-[#850B10] shadow-[0_0_16px_-2px_rgba(133,11,16,0.45)]"
                  : "border-ink/10"
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setOpenId(b.id)}
                  className="flex min-w-0 items-center gap-3 text-start"
                >
                  <BookingAvatar name={b.name} pending={b.status === "pending"} size="lg" />
                  <span className="min-w-0">
                    <span className="block truncate font-semibold text-ink">{b.name}</span>
                    <span dir="ltr" className="block truncate text-fluid-xs text-ink-faint">
                      {b.phone}
                    </span>
                  </span>
                </button>
                <StatusPill status={b.status} />
              </div>

              <div className="my-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-ink/5 py-2.5 text-fluid-xs text-ink-soft">
                <span dir="ltr">{formatVisitDate(b.visit_date)}</span>
                <span>{VISITOR_TYPE_LABELS[b.visitor_type]}</span>
                <span className="text-ink-faint">{b.guest_count} کەس</span>
              </div>

              <BookingActions
                booking={b}
                busy={busyId === b.id}
                onRequestStatus={(status) => setConfirmTask({ id: b.id, name: b.name, status })}
                onView={() => setOpenId(b.id)}
                onPrint={() => printBooking(b)}
              />
            </div>
          )}
        />
      )}

      <BookingDrawer booking={openBooking} onClose={() => setOpenId(null)} />

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
