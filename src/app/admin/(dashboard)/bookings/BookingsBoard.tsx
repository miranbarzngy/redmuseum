"use client";

import { useMemo, useState, useTransition } from "react";
import { Ticket, Clock, CheckCircle2, LogIn, XCircle, CircleSlash, AlertTriangle, Eye, Check, X, Loader2, Printer } from "lucide-react";
import clsx from "clsx";
import { updateBookingStatus, getFacePhotoUrl } from "./actions";
import { openBookingPrint } from "./bookingPrint";
import { formatVisitDate } from "./formatBookingDate";
import { STATUS_LABELS, STATUS_SOLID } from "./status";
import { VISITOR_TYPE_LABELS } from "./visitorType";
import { BookingDetailModal } from "./BookingDetailModal";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { EmptyState } from "../../_components/EmptyState";
import { DataList, type Column } from "../../_components/DataList";
import type { BookingRow, BookingStatus } from "@/lib/supabase/database.types";

type Filter = "all" | BookingStatus;
type DateRange = "all" | "today" | "week" | "month" | "custom";
type TargetStatus = "confirmed" | "cancelled" | "checked_in" | "no_show";

const CONFIRM_MESSAGE: Record<TargetStatus, string> = {
  confirmed: "ئەم داواکاریی سەردانە پەسەند بکرێت؟",
  cancelled: "ئەم داواکاریی سەردانە ڕەت بکرێتەوە؟",
  checked_in: "دیاری بکرێت کە میوانەکە هاتووە؟",
  no_show: "دیاری بکرێت کە میوانەکە نەهاتووە؟",
};
const DANGER_STATUS = new Set<TargetStatus>(["cancelled", "no_show"]);

const DATE_RANGES: { key: Exclude<DateRange, "custom">; label: string }[] = [
  { key: "all", label: "هەموو" },
  { key: "today", label: "ئەمڕۆ" },
  { key: "week", label: "ئەم هەفتەیە" },
  { key: "month", label: "ئەم مانگە" },
];

const dateInputClass =
  "rounded-xl border border-ink/15 bg-canvas px-3 py-1.5 text-fluid-xs text-ink outline-none transition-colors focus:border-pigment-terracotta";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "؟";
}

/** A round coloured icon button with its label stacked underneath. */
function IconAction({
  label,
  colorClass,
  onClick,
  disabled,
  children,
}: {
  label: string;
  colorClass: string;
  onClick: () => void;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      className="flex w-14 shrink-0 flex-col items-center gap-1 disabled:opacity-60"
    >
      <span
        className={clsx(
          "flex h-9 w-9 items-center justify-center rounded-full text-white transition-colors",
          colorClass
        )}
      >
        {children}
      </span>
      <span className="font-kurdish text-center text-[10px] font-medium leading-tight text-ink-soft">
        {label}
      </span>
    </button>
  );
}

/** Avatar circle with a red "needs action" dot for still-pending bookings. */
function Avatar({ name, pending, big = false }: { name: string; pending: boolean; big?: boolean }) {
  return (
    <span className="relative shrink-0">
      <span
        className={clsx(
          "flex items-center justify-center rounded-full bg-canvas-paper text-fluid-xs font-semibold text-ink-soft",
          big ? "h-10 w-10" : "h-9 w-9"
        )}
      >
        {initials(name)}
      </span>
      {pending && (
        <span
          aria-label="نوێ — پەسەند نەکراوە"
          className="animate-glow-ring absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#850B10] ring-2 ring-white"
        />
      )}
    </span>
  );
}

const STATUS_ICON: Record<BookingStatus, typeof Ticket> = {
  pending: Clock,
  confirmed: CheckCircle2,
  checked_in: LogIn,
  cancelled: XCircle,
  no_show: CircleSlash,
};

function printBooking(b: BookingRow) {
  // Kick off the signed-URL fetch here (sync) and hand the promise to
  // openBookingPrint, which opens its window before awaiting it.
  openBookingPrint(b, b.face_image_path ? getFacePhotoUrl(b.face_image_path) : null);
}

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

export function BookingsBoard({
  bookings,
  initialViewId = null,
}: {
  bookings: BookingRow[];
  initialViewId?: string | null;
}) {
  const [filter, setFilter] = useState<Filter>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
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

  function pickPreset(key: DateRange) {
    setDateRange(key);
    setCustomFrom("");
    setCustomTo("");
    setShowOverdueOnly(false);
  }

  function pickStatus(key: Filter) {
    setShowOverdueOnly(false);
    setFilter(key);
  }

  // Two numbers per status: how many bookings, and how many people
  // (sum of guest_count). Both scoped to the active date filter.
  const counts = useMemo(() => {
    const empty = (): Record<Filter, number> => ({
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

  const visible = showOverdueOnly
    ? overdue
    : filter === "all"
      ? dateScoped
      : dateScoped.filter((b) => b.status === filter);
  const openBooking = openId ? bookings.find((b) => b.id === openId) ?? null : null;

  const stats: { key: Filter; label: string; Icon: typeof Ticket }[] = [
    { key: "all", label: "کۆی گشتی", Icon: Ticket },
    { key: "pending", label: STATUS_LABELS.pending, Icon: Clock },
    { key: "confirmed", label: STATUS_LABELS.confirmed, Icon: CheckCircle2 },
    { key: "checked_in", label: STATUS_LABELS.checked_in, Icon: LogIn },
    { key: "no_show", label: STATUS_LABELS.no_show, Icon: CircleSlash },
    { key: "cancelled", label: STATUS_LABELS.cancelled, Icon: XCircle },
  ];

  function RowStatusActions({ b }: { b: BookingRow }) {
    if (b.status !== "pending" && b.status !== "confirmed") return null;
    const busy = busyId === b.id;

    // pending → approve / reject (Check / X) ;
    // confirmed → visited / no-show (LogIn / CircleSlash) — deliberately
    // different glyphs so it's obvious this is the arrival step, not approval.
    const [positive, negative] =
      b.status === "pending"
        ? ([
            { status: "confirmed" as const, label: "پەسەندکردن", Icon: Check },
            { status: "cancelled" as const, label: "ڕەتکردنەوە", Icon: X },
          ] as const)
        : ([
            { status: "checked_in" as const, label: "هاتوو", Icon: LogIn },
            { status: "no_show" as const, label: "نەهاتوو", Icon: CircleSlash },
          ] as const);

    return (
      <>
        <IconAction
          label={positive.label}
          colorClass="bg-[#0C6B4E] hover:bg-[#0A5A41]"
          disabled={busy}
          onClick={() => setConfirmTask({ id: b.id, name: b.name, status: positive.status })}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <positive.Icon size={16} strokeWidth={2.75} />}
        </IconAction>
        <IconAction
          label={negative.label}
          colorClass="bg-[#850B10] hover:bg-[#6a090d]"
          disabled={busy}
          onClick={() => setConfirmTask({ id: b.id, name: b.name, status: negative.status })}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <negative.Icon size={16} strokeWidth={2.75} />}
        </IconAction>
      </>
    );
  }

  const nameCell = (b: BookingRow) => (
    <button type="button" onClick={() => setOpenId(b.id)} className="flex items-center gap-3 text-start">
      <Avatar name={b.name} pending={b.status === "pending"} />
      <span className="min-w-0">
        <span className="block truncate font-medium text-ink transition-colors hover:text-pigment-terracotta">
          {b.name}
        </span>
        <span dir="ltr" className="block truncate text-fluid-xs font-normal text-ink-faint">
          {b.phone}
        </span>
      </span>
    </button>
  );

  const columns: Column<BookingRow>[] = [
    { key: "name", header: "میوان", cell: nameCell },
    {
      key: "quick",
      header: "",
      className: "w-32",
      cell: (b) => (
        <div className="flex items-start gap-2">
          <RowStatusActions b={b} />
        </div>
      ),
    },
    {
      key: "type",
      header: "جۆر",
      className: "w-44",
      cell: (b) => (
        <span className="text-fluid-xs text-ink-soft">
          {VISITOR_TYPE_LABELS[b.visitor_type]}
        </span>
      ),
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
      className: "w-36",
      cell: (b) => (
        <span dir="ltr" className="text-fluid-xs text-ink-soft">
          {formatVisitDate(b.visit_date)}
        </span>
      ),
    },
    {
      key: "status",
      header: "دۆخ",
      align: "center",
      className: "w-24",
      cell: (b) => {
        const Icon = STATUS_ICON[b.status];
        return (
          <span className="mx-auto flex w-20 flex-col items-center gap-1">
            <span
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-full",
                STATUS_SOLID[b.status]
              )}
            >
              <Icon size={16} strokeWidth={2.75} />
            </span>
            <span className="font-kurdish text-center text-[10px] font-medium leading-tight text-ink-soft">
              {STATUS_LABELS[b.status]}
            </span>
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "",
      align: "end",
      className: "w-32",
      cell: (b) => (
        <div className="flex items-start justify-end gap-2 whitespace-nowrap">
          <IconAction
            label="چاپکردن"
            colorClass="bg-[#1D5AA8] hover:bg-[#184C8F]"
            onClick={() => printBooking(b)}
          >
            <Printer size={16} strokeWidth={2.75} />
          </IconAction>
          <IconAction
            label="بینین"
            colorClass="bg-pigment-terracotta hover:bg-pigment-terracotta/90"
            onClick={() => setOpenId(b.id)}
          >
            <Eye size={16} strokeWidth={2.75} />
          </IconAction>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      {/* Date filter: quick presets + a custom from/to range */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {DATE_RANGES.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => pickPreset(key)}
              className={clsx(
                "font-kurdish rounded-full px-3.5 py-1.5 text-fluid-xs font-medium transition-colors",
                dateRange === key
                  ? "bg-[#850B10] text-canvas"
                  : "border border-ink/15 text-ink-soft hover:border-pigment-terracotta hover:text-pigment-terracotta"
              )}
            >
              {label}
            </button>
          ))}
        </div>

        <div
          className={clsx(
            "flex flex-wrap items-center gap-2 rounded-xl border px-3 py-2 transition-colors",
            dateRange === "custom" ? "border-pigment-terracotta/40 bg-pigment-terracotta/[0.04]" : "border-ink/10"
          )}
        >
          <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">بەرواری دیاریکراو:</span>
          <label className="flex items-center gap-1.5">
            <span className="font-kurdish text-fluid-xs text-ink-faint">لە</span>
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => {
                setCustomFrom(e.target.value);
                setDateRange("custom");
              }}
              className={dateInputClass}
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="font-kurdish text-fluid-xs text-ink-faint">بۆ</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => {
                setCustomTo(e.target.value);
                setDateRange("custom");
              }}
              className={dateInputClass}
            />
          </label>
          {dateRange === "custom" && (customFrom || customTo) && (
            <button
              type="button"
              onClick={() => pickPreset("all")}
              className="font-kurdish text-fluid-xs font-medium text-pigment-terracotta hover:underline"
            >
              پاککردنەوە
            </button>
          )}
        </div>
      </div>

      {/* KPI row (scoped to the active date filter). Tiles show the booking
          count; only "هاتووە" also splits out the visited-person total. */}
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-6">
        {stats.map(({ key, label, Icon }) => {
          const active = filter === key && !showOverdueOnly;
          return (
            <button
              key={key}
              type="button"
              onClick={() => pickStatus(key)}
              className={clsx(
                "group flex flex-col items-center gap-1 rounded-xl border bg-white p-2.5 text-center shadow-card transition-all hover:-translate-y-0.5 sm:gap-2 sm:rounded-2xl sm:p-4",
                active
                  ? "border-2 border-[#850B10] ring-2 ring-[#850B10]/20"
                  : "border-ink/10 hover:border-[#850B10]/30"
              )}
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#850B10] text-white sm:h-12 sm:w-12">
                <Icon className="h-4 w-4 sm:h-[22px] sm:w-[22px]" strokeWidth={2.5} />
              </span>
              <span className="font-kurdish text-fluid-lg font-semibold leading-none text-ink sm:text-fluid-2xl">
                {counts.rows[key]}
              </span>
              <span className="font-kurdish text-[11px] leading-tight text-ink-soft sm:text-fluid-xs">{label}</span>
              {key === "checked_in" && (
                <span className="font-kurdish text-[11px] font-medium leading-tight text-pigment-teal sm:text-fluid-xs">
                  {counts.people.checked_in} کەس هاتوون
                </span>
              )}
            </button>
          );
        })}
      </div>

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
          renderCard={(b) => {
            const StatusIcon = STATUS_ICON[b.status];
            return (
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
                    <Avatar name={b.name} pending={b.status === "pending"} big />
                    <span className="min-w-0">
                      <span className="block truncate font-semibold text-ink">{b.name}</span>
                      <span dir="ltr" className="block truncate text-fluid-xs text-ink-faint">
                        {b.phone}
                      </span>
                    </span>
                  </button>
                  <span className="flex shrink-0 flex-col items-center gap-1">
                    <span
                      className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full",
                        STATUS_SOLID[b.status]
                      )}
                    >
                      <StatusIcon size={15} strokeWidth={2.5} />
                    </span>
                    <span className="font-kurdish text-[10px] font-medium leading-none text-ink-soft">
                      {STATUS_LABELS[b.status]}
                    </span>
                  </span>
                </div>

                <div className="my-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-y border-ink/5 py-2.5 text-fluid-xs text-ink-soft">
                  <span dir="ltr">{formatVisitDate(b.visit_date)}</span>
                  <span>{VISITOR_TYPE_LABELS[b.visitor_type]}</span>
                  <span className="text-ink-faint">{b.guest_count} کەس</span>
                </div>

                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div className="flex items-start gap-2">
                    <RowStatusActions b={b} />
                  </div>
                  <div className="flex items-start gap-2">
                    <IconAction
                      label="چاپکردن"
                      colorClass="bg-[#1D5AA8] hover:bg-[#184C8F]"
                      onClick={() => printBooking(b)}
                    >
                      <Printer size={16} strokeWidth={2.75} />
                    </IconAction>
                    <IconAction
                      label="بینین"
                      colorClass="bg-pigment-terracotta hover:bg-pigment-terracotta/90"
                      onClick={() => setOpenId(b.id)}
                    >
                      <Eye size={16} strokeWidth={2.75} />
                    </IconAction>
                  </div>
                </div>
              </div>
            );
          }}
        />
      )}

      {openBooking && <BookingDetailModal booking={openBooking} onClose={() => setOpenId(null)} />}

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
