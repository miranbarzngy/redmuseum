import clsx from "clsx";
import { Ticket, Clock, CheckCircle2, LogIn, XCircle, CircleSlash } from "lucide-react";
import { STATUS_LABELS } from "./status";
import type { BookingStatus } from "@/lib/supabase/database.types";

export type BookingFilter = "all" | BookingStatus;

const STAT_ICON: Record<BookingFilter, typeof Ticket> = {
  all: Ticket,
  pending: Clock,
  confirmed: CheckCircle2,
  checked_in: LogIn,
  cancelled: XCircle,
  no_show: CircleSlash,
};

const STAT_ORDER: BookingFilter[] = ["all", "pending", "confirmed", "checked_in", "no_show", "cancelled"];

/**
 * Compact KPI strip doubling as the status filter — six small cards (all
 * five statuses + a total), each an icon circle over a count. Kept
 * deliberately small: this is a glance-and-click header, not the page's
 * focal point, so it shouldn't compete with the table below it.
 */
export function BookingStatCards({
  counts,
  filter,
  onSelect,
}: {
  counts: { rows: Record<BookingFilter, number>; people: Record<BookingFilter, number> };
  filter: BookingFilter;
  onSelect: (key: BookingFilter) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6">
      {STAT_ORDER.map((key) => {
        const Icon = STAT_ICON[key];
        const label = key === "all" ? "کۆی گشتی" : STATUS_LABELS[key];
        const active = filter === key;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            className={clsx(
              "group flex flex-col items-center gap-1 rounded-xl border bg-white p-2 text-center shadow-card transition-all hover:-translate-y-0.5",
              active
                ? "border-2 border-[#850B10] ring-1 ring-[#850B10]/20"
                : "border-ink/10 hover:border-[#850B10]/30"
            )}
          >
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#850B10] text-white sm:h-8 sm:w-8">
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            </span>
            <span className="font-kurdish text-fluid-sm font-semibold leading-none text-ink sm:text-fluid-base">
              {counts.rows[key]}
            </span>
            <span className="font-kurdish text-[10px] leading-tight text-ink-soft">{label}</span>
            {key === "checked_in" && counts.people.checked_in > 0 && (
              <span className="font-kurdish text-[9px] font-medium leading-tight text-pigment-teal">
                {counts.people.checked_in} کەس
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
