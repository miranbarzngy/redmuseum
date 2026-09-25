import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuthorizedCron } from "@/lib/webhookAuth";
import { sendAdminPush } from "@/lib/adminPush";

// Daily nudge: a booking that was confirmed but whose visit date has
// already passed while its status is still "confirmed" means the admin
// never marked whether the guest actually showed up (checked_in / no_show).
// This route counts those and pushes a reminder to the APK.
//
// Wired to a schedule two ways (either is enough):
//   - Supabase pg_cron — supabase/migrations/0037_booking_reminder_cron.sql
//   - a Vercel Cron hitting this path once a day
//
// Auth: the same WEBHOOK_SECRET the notify triggers use (x-webhook-secret
// header), OR a Bearer CRON_SECRET (what Vercel Cron sends when CRON_SECRET
// is set). Accepts GET and POST so both schedulers work.

async function handle(request: Request) {
  if (!isAuthorizedCron(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const today = new Date().toISOString().split("T")[0];

  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("bookings")
    .select("id", { count: "exact", head: true })
    .eq("status", "confirmed")
    .lt("visit_date", today);

  if (error) {
    console.error("[booking/reminders] query failed", error.message);
    return NextResponse.json({ ok: false, error: "query_failed" }, { status: 500 });
  }

  const overdue = count ?? 0;
  if (overdue === 0) {
    return NextResponse.json({ ok: true, overdue: 0, sent: 0 });
  }

  try {
    const { sent } = await sendAdminPush({
      title: "نوێکردنەوەی دۆخی سەردان",
      body: `${overdue} سەردانی پشتڕاستکراو تێپەڕیوە و هێشتا نەشیکراوەتەوە — دیاری بکە هاتوون یان نەهاتوون.`,
      url: "/admin/bookings",
    });
    return NextResponse.json({ ok: true, overdue, sent });
  } catch {
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  }
}

export const GET = handle;
export const POST = handle;
