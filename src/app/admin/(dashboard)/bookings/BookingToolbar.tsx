"use client";

import { Search, CalendarRange } from "lucide-react";
import clsx from "clsx";
import { fieldControlClass } from "../../_components/Field";
import { slidingIndicatorMotion, useSlidingIndicator } from "../../_components/useSlidingIndicator";

export type DateRange = "all" | "today" | "week" | "month" | "custom";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: "هەموو بەروارەکان",
  today: "ئەمڕۆ",
  week: "ئەم هەفتەیە",
  month: "ئەم مانگە",
  custom: "بەرواری دیاریکراو",
};

const compactFieldClass =
  "rounded-xl border border-ink/15 bg-white/80 px-3 py-2 text-fluid-xs text-ink outline-none transition-colors focus:border-brand/40 focus:ring-2 focus:ring-brand/10";

/** Toolbar row: name/phone search + date-range pills that reveal a compact
 * custom from/to pair when "بەرواری دیاریکراو" is picked. Status filtering
 * lives one row up in <BookingStatCards>, so this row stays narrowly about
 * search + date to avoid a second, redundant status control. The picked
 * range sits on a brand pill that springs between the frosted-glass pills. */
export function BookingToolbar({
  query,
  onQueryChange,
  dateRange,
  onDateRangeChange,
  customFrom,
  onCustomFromChange,
  customTo,
  onCustomToChange,
}: {
  query: string;
  onQueryChange: (value: string) => void;
  dateRange: DateRange;
  onDateRangeChange: (value: DateRange) => void;
  customFrom: string;
  onCustomFromChange: (value: string) => void;
  customTo: string;
  onCustomToChange: (value: string) => void;
}) {
  const { containerRef, indicatorRef } = useSlidingIndicator<HTMLDivElement, HTMLSpanElement>(dateRange);

  return (
    <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between">
      <div className="relative w-full sm:max-w-xs">
        <input
          type="text"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="گەڕان بە ناو یان ژمارەی مۆبایل..."
          className={clsx(fieldControlClass, "py-2 ps-9")}
        />
        <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint" />
      </div>

      <div ref={containerRef} className="group/pill relative flex flex-wrap items-center gap-1.5">
        <span
          ref={indicatorRef}
          aria-hidden
          className={clsx(
            "pointer-events-none absolute left-0 top-0 rounded-full bg-brand-fill opacity-0 shadow-brand",
            slidingIndicatorMotion
          )}
        />
        {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((key) => {
          const active = dateRange === key;
          return (
            <button
              key={key}
              type="button"
              onClick={() => onDateRangeChange(key)}
              data-active={active}
              aria-pressed={active}
              className={clsx(
                "font-kurdish relative inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-fluid-xs font-medium transition-[color,background-color,box-shadow,transform] duration-300 ease-spring active:scale-95",
                active
                  ? "bg-brand-fill text-white shadow-brand group-data-[pill=ready]/pill:bg-none group-data-[pill=ready]/pill:shadow-none"
                  : "bg-white/70 text-ink-soft shadow-[0_1px_2px_rgba(28,27,25,0.05)] ring-1 ring-inset ring-ink/10 backdrop-blur-sm hover:bg-white hover:text-ink"
              )}
            >
              {key === "custom" && <CalendarRange size={13} />}
              {DATE_RANGE_LABELS[key]}
            </button>
          );
        })}

        {dateRange === "custom" && (
          <div className="flex items-center gap-1.5">
            <input
              type="date"
              value={customFrom}
              max={customTo || undefined}
              onChange={(e) => onCustomFromChange(e.target.value)}
              className={compactFieldClass}
            />
            <span className="font-kurdish text-fluid-xs text-ink-faint">بۆ</span>
            <input
              type="date"
              value={customTo}
              min={customFrom || undefined}
              onChange={(e) => onCustomToChange(e.target.value)}
              className={compactFieldClass}
            />
          </div>
        )}
      </div>
    </div>
  );
}
