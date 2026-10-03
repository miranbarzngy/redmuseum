import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/webhookAuth";

// Face photos exist only to verify identity at check-in, so none is kept
// longer than that needs. Two passes over the private face-scans bucket:
//
//   1. Retention — a booking's photo is deleted RETENTION_DAYS after the
//      *visit date* (not the booking's created_at: a booking made weeks
//      ahead still needs its photo right up to the day of), and
//      bookings.face_image_path is cleared. The booking row itself stays.
//   2. Orphans — photos no booking points at: uploads from a booking wizard
//      that was never submitted, and photos left behind when a booking was
//      deleted. Removed once ORPHAN_MIN_AGE_HOURS old, which keeps clear of
//      a visitor still in the wizard (face_scan_orphans(), 0072).
//
// Wired to a schedule two ways (either is enough), same as
// /api/booking/reminders:
//   - Supabase pg_cron — supabase/migrations/0053_face_photo_retention_cron.sql
//   - a Vercel Cron hitting this path once a day
//
// Auth: same as reminders — x-webhook-secret OR Bearer CRON_SECRET.

const RETENTION_DAYS = 10;
const ORPHAN_MIN_AGE_HOURS = 24;
// Bounds each pass per run; any remainder just gets picked up by tomorrow's run.
const BATCH_SIZE = 500;

type AdminClient = ReturnType<typeof createAdminClient>;
type PassResult = { deleted: number } | { error: string };

async function deleteExpiredPhotos(supabase: AdminClient): Promise<PassResult> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const { data: rows, error: selectError } = await supabase
    .from("bookings")
    .select("id, face_image_path")
    .not("face_image_path", "is", null)
    .lt("visit_date", cutoffDate)
    .limit(BATCH_SIZE);

  if (selectError) {
    console.error("[booking/cleanup-photos] query failed", selectError.message);
    return { error: "query_failed" };
  }
  if (!rows || rows.length === 0) return { deleted: 0 };

  const paths = rows.map((r) => r.face_image_path).filter((p): p is string => Boolean(p));

  // Deliberately deletes storage first, then clears the column — if the
  // update failed after a successful delete we'd rather retry a no-op
  // remove() tomorrow (harmless) than leave a path pointing at nothing.
  const { error: removeError } = await supabase.storage.from("face-scans").remove(paths);
  if (removeError) {
    console.error("[booking/cleanup-photos] storage removal failed", removeError.message);
    return { error: "remove_failed" };
  }

  const ids = rows.map((r) => r.id);
  const { error: updateError } = await supabase.from("bookings").update({ face_image_path: null }).in("id", ids);
  if (updateError) {
    console.error("[booking/cleanup-photos] failed to clear face_image_path", updateError.message);
    return { error: "update_failed" };
  }

  return { deleted: ids.length };
}

async function deleteOrphanedPhotos(supabase: AdminClient): Promise<PassResult> {
  const { data: paths, error } = await supabase.rpc("face_scan_orphans", {
    p_min_age_hours: ORPHAN_MIN_AGE_HOURS,
    p_limit: BATCH_SIZE,
  });
  if (error) {
    console.error("[booking/cleanup-photos] orphan query failed", error.message);
    return { error: "orphan_query_failed" };
  }
  if (!paths || paths.length === 0) return { deleted: 0 };

  const { error: removeError } = await supabase.storage.from("face-scans").remove(paths);
  if (removeError) {
    console.error("[booking/cleanup-photos] orphan removal failed", removeError.message);
    return { error: "orphan_remove_failed" };
  }

  return { deleted: paths.length };
}

async function handle(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  // The passes are independent — one failing doesn't stop the other.
  const supabase = createAdminClient();
  const expired = await deleteExpiredPhotos(supabase);
  const orphaned = await deleteOrphanedPhotos(supabase);

  const body = {
    deleted: "deleted" in expired ? expired.deleted : 0,
    orphansDeleted: "deleted" in orphaned ? orphaned.deleted : 0,
  };
  const error = ("error" in expired && expired.error) || ("error" in orphaned && orphaned.error);
  if (error) {
    return NextResponse.json({ ok: false, error, ...body }, { status: 500 });
  }
  return NextResponse.json({ ok: true, ...body });
}

export const GET = handle;
export const POST = handle;
