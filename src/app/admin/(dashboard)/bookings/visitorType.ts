import type { BookingVisitorType } from "@/lib/supabase/database.types";

/** Visit-type vocabulary for the booking form's info step — kept in a plain
 * (non-"use client") module so the server-rendered bookings list and detail
 * pages can label rows without pulling in any client component. Mirrors
 * booking.form.visitorTypes in messages/ku.json (the admin panel is
 * Kurdish-only). */

export const VISITOR_TYPE_LABELS: Record<BookingVisitorType, string> = {
  school: "خوێندنگە",
  university: "زانکۆ",
  delegation: "سەردانی وەفدی فەرمی",
  personal: "سەردانی کەسی",
  press: "ڕۆژنامەوانی",
  other: "هیتر",
};
