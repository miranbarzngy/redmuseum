import "server-only";
import { createClient } from "@/lib/supabase/server";

export interface BookingSettings {
  /** JS Date.getDay() numbers, 0 = Sunday … 6 = Saturday. */
  openWeekdays: number[];
  /** Bookable start times, "HH:MM". */
  timeSlots: string[];
  /** How many days ahead the day picker shows. */
  bookingWindowDays: number;
}

export const DEFAULT_BOOKING_SETTINGS: BookingSettings = {
  openWeekdays: [0, 1, 2, 3, 4, 5, 6],
  timeSlots: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"],
  bookingWindowDays: 21,
};

/** Reads booking_settings (0036). Falls back to the defaults above if the
 * row is missing or the read fails, so the public wizard always renders. */
export async function getBookingSettings(): Promise<BookingSettings> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("booking_settings")
    .select("open_weekdays, time_slots, booking_window_days")
    .eq("id", 1)
    .maybeSingle();

  if (error || !data) {
    if (error) console.error("[data] failed to load booking settings", error.message);
    return DEFAULT_BOOKING_SETTINGS;
  }

  const openWeekdays = (data.open_weekdays ?? [])
    .map(Number)
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);
  const timeSlots = (data.time_slots ?? []).filter((s) => /^\d{2}:\d{2}$/.test(s)).sort();
  const bookingWindowDays = Math.min(Math.max(Number(data.booking_window_days) || 21, 1), 120);

  return {
    openWeekdays: openWeekdays.length > 0 ? openWeekdays : DEFAULT_BOOKING_SETTINGS.openWeekdays,
    timeSlots: timeSlots.length > 0 ? timeSlots : DEFAULT_BOOKING_SETTINGS.timeSlots,
    bookingWindowDays,
  };
}
