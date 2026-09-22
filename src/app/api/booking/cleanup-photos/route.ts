import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Face photos exist only to verify identity at check-in, so there's no
// reason to keep paying storage for them once a visit is long past. This
// deletes the object from the private face-scans bucket and clears
// bookings.face_image_path — the booking row itself is untouched, only the
// photo goes away.
//
// The cutoff is RETENTION_DAYS after the *visit date*, not the booking's
// created_at: a booking made weeks ahead of its visit still needs the photo
// intact right up to the day of, so submission date would be wrong here.
//
// Wired to a schedule two ways (either is enough), same as
// /api/booking/reminders:
//   - Supabase pg_cron — supabase/migrations/0053_face_photo_retention_cron.sql
//   - a Vercel Cron hitting this path once a day
//
// Auth: same as reminders — x-webhook-secret OR Bearer CRON_SECRET.

const RETENTION_DAYS = 10;
// Bounds each run; any remainder just gets picked up by tomorrow's run.
const BATCH_SIZE = 500;

function authorized(request: Request): boolean {
  const secret = request.headers.get("x-webhook-secret");
  if (secret && secret === process.env.WEBHOOK_SECRET) return true;

  const auth = request.headers.get("authorization");
  if (auth && process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`) return true;

  return false;
}

async function handle(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);
  const cutoffDate = cutoff.toISOString().split("T")[0];

  const supabase = createAdminClient();
  const { data: rows, error: selectError } = await supabase
    .from("bookings")
    .select("id, face_image_path")
    .not("face_image_path", "is", null)
    .lt("visit_date", cutoffDate)
    .limit(BATCH_SIZE);

  if (selectError) {
    console.error("[booking/cleanup-photos] query failed", selectError.message);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ ok: true, deleted: 0 });
  }

  const paths = rows.map((r) => r.face_image_path).filter((p): p is string => Boolean(p));

  // Deliberately deletes storage first, then clears the column — if the
  // update failed after a successful delete we'd rather retry a no-op
  // remove() tomorrow (harmless) than leave a path pointing at nothing.
  const { error: removeError } = await supabase.storage.from("face-scans").remove(paths);
  if (removeError) {
    console.error("[booking/cleanup-photos] storage removal failed", removeError.message);
    return NextResponse.json({ ok: false, error: "remove_failed" }, { status: 500 });
  }

  const ids = rows.map((r) => r.id);
  const { error: updateError } = await supabase.from("bookings").update({ face_image_path: null }).in("id", ids);

  if (updateError) {
    console.error("[booking/cleanup-photos] failed to clear face_image_path", updateError.message);
    return NextResponse.json({ ok: false, error: "update_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, deleted: ids.length });
}

export const GET = handle;
export const POST = handle;
