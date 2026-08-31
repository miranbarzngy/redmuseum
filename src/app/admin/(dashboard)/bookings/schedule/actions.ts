"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { routing } from "@/i18n/routing";
import type { BookingSettingsRow } from "@/lib/supabase/database.types";

const DEFAULTS: Omit<BookingSettingsRow, "updated_at"> = {
  id: 1,
  open_weekdays: [0, 1, 2, 3, 4, 5, 6],
  time_slots: ["09:00", "10:00", "11:00", "13:00", "14:00", "15:00"],
  booking_window_days: 21,
};

export async function getBookingSettingsAdmin(): Promise<BookingSettingsRow> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("booking_settings")
    .select("*")
    .eq("id", 1)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? { ...DEFAULTS, updated_at: new Date().toISOString() };
}

export async function updateBookingSettings(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const open_weekdays = formData
    .getAll("weekday")
    .map((v) => Number(v))
    .filter((n) => Number.isInteger(n) && n >= 0 && n <= 6);

  const time_slots = formData
    .getAll("slot")
    .map(String)
    .filter((s) => /^\d{2}:\d{2}$/.test(s))
    .sort();

  const booking_window_days = Math.min(
    Math.max(Number(formData.get("booking_window_days")) || 21, 1),
    120
  );

  const { error } = await supabase.from("booking_settings").upsert({
    id: 1,
    open_weekdays: open_weekdays.length > 0 ? open_weekdays : DEFAULTS.open_weekdays,
    time_slots: time_slots.length > 0 ? time_slots : DEFAULTS.time_slots,
    booking_window_days,
    updated_at: new Date().toISOString(),
  });

  if (error) throw new Error(error.message);

  revalidatePath("/admin/bookings/schedule");
  for (const locale of routing.locales) revalidatePath(`/${locale}/booking`);

  redirect("/admin/bookings/schedule?saved=1");
}
