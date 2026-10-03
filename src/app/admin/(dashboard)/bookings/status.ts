import type { BookingStatus } from "@/lib/supabase/database.types";

/** Booking status vocabulary — kept in a plain (non-"use client") module so
 * server components (list filters, badges, the overview dashboard) can read
 * it without pulling in the interactive <StatusSelect>. */

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "چاوەڕوان",
  confirmed: "پەسندکراو",
  checked_in: "هاتوو",
  cancelled: "هەڵوەشێنراوەتەوە",
  no_show: "نەهاتووە",
};

export const STATUS_ORDER: BookingStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "cancelled",
  "no_show",
];

/** Pill background + text — the card and details-sheet status indicator
 * (StatusPill, StatusSelect). The two states that need acting on are
 * filled: gold for pending (waiting on a decision), the brand red for
 * confirmed. Attended is a soft emerald; cancelled and no-show are neutral
 * gray, told apart by their dot — cancelled is deliberately not red, so it
 * can't be mistaken for confirmed. */
export const STATUS_PILL: Record<BookingStatus, string> = {
  pending: "bg-gold-fill text-[#3B2A00] shadow-[0_4px_10px_-4px_rgba(194,154,36,0.6)]",
  confirmed: "bg-brand-fill text-white shadow-brand",
  checked_in: "bg-emerald-50 text-emerald-700 ring-1 ring-inset ring-emerald-600/15",
  cancelled: "bg-ink/[0.06] text-ink-soft",
  no_show: "bg-ink/[0.04] text-ink-faint ring-1 ring-inset ring-ink/10",
};

/** Matching dot colour for STATUS_PILL. */
export const STATUS_DOT: Record<BookingStatus, string> = {
  pending: "bg-[#5C4300]",
  confirmed: "bg-white",
  checked_in: "bg-emerald-500",
  cancelled: "bg-rose-500",
  no_show: "bg-ink-faint",
};
