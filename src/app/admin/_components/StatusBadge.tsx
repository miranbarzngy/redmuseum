import clsx from "clsx";
import type { BookingStatus } from "@/lib/supabase/database.types";

export type BadgeTone = "neutral" | "positive" | "warning" | "danger" | "muted" | "accent";

const TONE: Record<BadgeTone, string> = {
  neutral: "bg-ink/10 text-ink",
  positive: "bg-pigment-teal/15 text-pigment-teal",
  warning: "bg-pigment-gold/15 text-[#8a6d1f]",
  danger: "bg-pigment-crimson/10 text-pigment-crimson",
  muted: "bg-ink/5 text-ink-faint",
  accent: "bg-pigment-terracotta/12 text-pigment-terracotta",
};

/** Small pill for statuses — booking state, read/unread, active/inactive. */
export function StatusBadge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: React.ReactNode;
  tone?: BadgeTone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={clsx(
        "font-kurdish inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-fluid-xs font-medium",
        TONE[tone],
        className
      )}
    >
      {dot && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {children}
    </span>
  );
}

export const BOOKING_STATUS_TONE: Record<BookingStatus, BadgeTone> = {
  pending: "warning",
  confirmed: "positive",
  checked_in: "neutral",
  cancelled: "danger",
  no_show: "muted",
};
