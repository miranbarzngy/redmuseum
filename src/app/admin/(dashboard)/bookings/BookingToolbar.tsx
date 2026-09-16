import { Search, CalendarRange } from "lucide-react";
import clsx from "clsx";
import { fieldControlClass } from "../../_components/Field";

export type DateRange = "all" | "today" | "week" | "month" | "custom";

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  all: "هەموو بەروارەکان",
  today: "ئەمڕۆ",
  week: "ئەم هەفتەیە",
  month: "ئەم مانگە",
  custom: "بەرواری دیاریکراو",
};

const compactFieldClass =
  "rounded-xl border border-ink/15 bg-canvas px-3 py-2 text-fluid-xs text-ink outline-none transition-colors focus:border-pigment-terracotta";

/** Toolbar row: name/phone search + a date-range dropdown that reveals a
 * compact custom from/to pair when "بەرواری دیاریکراو" is picked. Status
 * filtering lives one row up in <BookingStatCards>, so this row stays
 * narrowly about search + date to avoid a second, redundant status control. */
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

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value as DateRange)}
            className={clsx(compactFieldClass, "font-kurdish appearance-none ps-8 pe-3")}
          >
            {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((key) => (
              <option key={key} value={key}>
                {DATE_RANGE_LABELS[key]}
              </option>
            ))}
          </select>
          <CalendarRange
            size={13}
            className="pointer-events-none absolute start-2.5 top-1/2 -translate-y-1/2 text-ink-faint"
          />
        </div>

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
