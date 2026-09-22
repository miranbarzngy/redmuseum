"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/adminAuth";
import { withAuditLog } from "@/lib/auditLogger";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { BookingRow, BookingStatus } from "@/lib/supabase/database.types";

// Which audit action a status transition counts as — StatusSelect and
// BookingsBoard's quick approve/reject/visited/no-show buttons all funnel
// through updateBookingStatus below, so labelling it here covers every path.
const STATUS_ACTION: Record<BookingStatus, string> = {
  pending: "update_booking_status",
  confirmed: "accept_booking",
  cancelled: "decline_booking",
  checked_in: "mark_booking_visited",
  no_show: "mark_booking_not_visited",
};

// bookings holds visitor PII (and, when face scan is on, biometric data)
// with no public-read RLS policy — same shape as contact_messages. Reads
// live here, next to the writes, all gated by requireAdminSession().

export async function getBookings(): Promise<BookingRow[]> {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .order("visit_date", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getPendingBookingCount(): Promise<number> {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getBooking(id: string): Promise<BookingRow | null> {
  await requireAdminSession(PERMISSIONS.bookingsManage);
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
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("face-scans").createSignedUrl(path, 300);

  if (error) {
    console.error("[bookings] failed to sign face photo url", error.message);
    return null;
  }
  return data.signedUrl;
}

/** Batch version of getFacePhotoUrl for the bookings grid — one signed-url
 * call for every visible card's photo instead of N, keyed by path so
 * BookingsBoard can look each one up by `booking.face_image_path`. */
export async function getFacePhotoUrls(paths: string[]): Promise<Record<string, string>> {
  if (paths.length === 0) return {};
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { data, error } = await supabase.storage.from("face-scans").createSignedUrls(paths, 300);

  if (error) {
    console.error("[bookings] failed to sign face photo urls", error.message);
    return {};
  }

  const urls: Record<string, string> = {};
  for (const entry of data) {
    if (entry.signedUrl && !entry.error) urls[entry.path ?? ""] = entry.signedUrl;
  }
  return urls;
}

export async function updateBookingStatus(id: string, status: BookingStatus) {
  const session = await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();

  await withAuditLog(session, STATUS_ACTION[status], "bookings", async () => {
    // Only the status field, not the full row — bookings carries visitor PII
    // (see the note atop this file), and a status change has no business
    // duplicating that into the audit log's details column.
    const { data: before } = await supabase
      .from("bookings")
      .select("status")
      .eq("id", id)
      .maybeSingle();
    const { error } = await supabase.from("bookings").update({ status }).eq("id", id);
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before, after: { status } };
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

export async function deleteBooking(id: string) {
  const session = await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();

  await withAuditLog(session, "delete_booking", "bookings", async () => {
    const { data: before } = await supabase.from("bookings").select().eq("id", id).maybeSingle();
    const { error } = await supabase.from("bookings").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before };
  });

  revalidatePath("/admin/bookings");
  revalidatePath("/admin");
}

/** Printing has no data to change, so there's nothing for withAuditLog to
 * diff — this just records that someone printed a booking and when. */
export async function logBookingPrinted(id: string) {
  const session = await requireAdminSession(PERMISSIONS.bookingsManage);
  await withAuditLog(session, "print_booking", "bookings", async () => ({
    result: undefined,
    targetId: id,
  }));
}
