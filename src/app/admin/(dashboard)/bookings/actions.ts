"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingRow, BookingStatus } from "@/lib/supabase/database.types";

// bookings holds visitor PII (and, when face scan is on, biometric data)
// with no public-read RLS policy — same shape as contact_messages. Reads
// live here, next to the writes, all gated by requireAdminSession().

export async function getBookings(): Promise<BookingRow[]> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("visit_date", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPendingBookingCount(): Promise<number> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getBooking(id: string): Promise<BookingRow | null> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("bookings").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

// The face-scans bucket is fully private (see 0024_face_scan_photos.sql) —
// this is the only way to view a captured photo, and only from inside a
// requireAdminSession()-gated call site. Short TTL since it's regenerated
// fresh on every page render rather than persisted anywhere.
export async function getFacePhotoUrl(path: string): Promise<string | null> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("face-scans").createSignedUrl(path, 300);

  if (error) {
    console.error("[bookings] failed to sign face photo url", error.message);
    return null;
  }
  return data.signedUrl;
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("bookings").update({ status }).eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
  revalidatePath(`/admin/bookings/${id}`);
  revalidatePath("/admin");
}

export async function deleteBooking(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("bookings").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
  redirect("/admin/bookings");
}
