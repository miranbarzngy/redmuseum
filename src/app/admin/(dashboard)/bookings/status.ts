import type { BookingStatus } from "@/lib/supabase/database.types";

/** Booking status vocabulary — kept in a plain (non-"use client") module so
 * server components (list filters, badges, the overview dashboard) can read
 * it without pulling in the interactive <StatusSelect>. */

export const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "چاوەڕوان",
  confirmed: "پشتڕاستکراوە",
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

/** Solid-fill variant for the bookings list's status pill. */
export const STATUS_SOLID: Record<BookingStatus, string> = {
  pending: "bg-[#A67C1E] text-white",
  confirmed: "bg-pigment-teal text-white",
  checked_in: "bg-[#850B10] text-white",
  cancelled: "bg-pigment-crimson text-white",
  no_show: "bg-ink-faint text-white",
};

export const STATUS_ORDER: BookingStatus[] = [
  "pending",
  "confirmed",
  "checked_in",
  "cancelled",
  "no_show",
];
