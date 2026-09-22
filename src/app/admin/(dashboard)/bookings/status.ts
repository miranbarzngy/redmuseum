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

export const STATUS_STYLES: Record<BookingStatus, string> = {
  pending: "bg-pigment-gold/15 text-[#8a6d1f]",
  confirmed: "bg-pigment-teal/15 text-pigment-teal",
  checked_in: "bg-ink/10 text-ink",
  cancelled: "bg-pigment-crimson/10 text-pigment-crimson",
  no_show: "bg-ink/5 text-ink-faint",
};

export const STATUS_ORDER: BookingStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "cancelled",
  "no_show",
];

/** Soft pill background + text — the table/card/drawer status indicator.
 * Emerald for attended, amber for pending, rose for cancelled, per the
 * bookings redesign spec; confirmed/no-show get a sky/slate tone so all
 * five stay visually distinct at a glance. */
export const STATUS_PILL: Record<BookingStatus, string> = {
  pending: "bg-amber-50 text-amber-700",
  confirmed: "bg-sky-50 text-sky-700",
  checked_in: "bg-emerald-50 text-emerald-700",
  cancelled: "bg-rose-50 text-rose-700",
  no_show: "bg-ink/5 text-ink-faint",
};

/** Matching dot colour for STATUS_PILL. */
export const STATUS_DOT: Record<BookingStatus, string> = {
  pending: "bg-amber-500",
  confirmed: "bg-sky-500",
  checked_in: "bg-emerald-500",
  cancelled: "bg-rose-500",
  no_show: "bg-ink-faint",
};
