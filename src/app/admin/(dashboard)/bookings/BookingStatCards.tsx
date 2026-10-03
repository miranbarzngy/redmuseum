"use client";

import clsx from "clsx";
import { Ticket, Clock, CheckCircle2, LogIn, XCircle, CircleSlash } from "lucide-react";
import { STATUS_LABELS } from "./status";
import { slidingIndicatorMotion, useSlidingIndicator } from "../../_components/useSlidingIndicator";
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
 * focal point, so it shouldn't compete with the list below it.
 *
 * Inactive cards are frosted white glass; the picked one sits on a brand
 * pill that springs between cards (useSlidingIndicator). While bookings
 * are waiting, the pending card's icon turns gold to draw the eye.
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
  const { containerRef, indicatorRef } = useSlidingIndicator<HTMLDivElement, HTMLSpanElement>(filter);

  return (
    <div ref={containerRef} className="group/pill relative grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6">
      <span
        ref={indicatorRef}
        aria-hidden
        className={clsx(
          "pointer-events-none absolute left-0 top-0 rounded-2xl bg-brand-fill opacity-0 shadow-brand",
          slidingIndicatorMotion
        )}
      />
      {STAT_ORDER.map((key) => {
        const Icon = STAT_ICON[key];
        const label = key === "all" ? "کۆی گشتی" : STATUS_LABELS[key];
        const active = filter === key;
        const waiting = key === "pending" && counts.rows.pending > 0;
        return (
          <button
            key={key}
            type="button"
            onClick={() => onSelect(key)}
            data-active={active}
            aria-pressed={active}
            className={clsx(
              "relative flex flex-col items-center gap-1 rounded-2xl p-2 text-center transition-[color,background-color,box-shadow,transform] duration-300 ease-spring active:scale-95",
              active
                ? "bg-brand-fill text-white shadow-brand group-data-[pill=ready]/pill:bg-none group-data-[pill=ready]/pill:shadow-none"
                : "bg-white/70 text-ink shadow-[0_1px_2px_rgba(28,27,25,0.05)] ring-1 ring-inset ring-ink/[0.08] backdrop-blur-sm hover:bg-white"
            )}
          >
            <span
              className={clsx(
                "flex h-7 w-7 items-center justify-center rounded-full transition-colors duration-300 sm:h-8 sm:w-8",
                active
                  ? "bg-white/20 text-white"
                  : waiting
                    ? "bg-gold-fill text-[#3B2A00] shadow-[0_4px_10px_-4px_rgba(194,154,36,0.7)]"
                    : "bg-brand/10 text-brand"
              )}
            >
              <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" strokeWidth={2.5} />
            </span>
            <span className="font-kurdish text-fluid-sm font-semibold leading-none tabular-nums sm:text-fluid-base">
              {counts.rows[key]}
            </span>
            <span
              className={clsx(
                "font-kurdish text-[10px] leading-tight transition-colors duration-300",
                active ? "text-white" : "text-ink-soft"
              )}
            >
              {label}
            </span>
            {key === "checked_in" && counts.people.checked_in > 0 && (
              <span
                className={clsx(
                  "font-kurdish text-[9px] font-medium leading-tight",
                  active ? "text-white" : "text-pigment-teal"
                )}
              >
                {counts.people.checked_in} کەس
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
