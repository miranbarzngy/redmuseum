import "server-only";
import { NextResponse } from "next/server";
import { sendAdminPush } from "@/lib/adminPush";

// Called by the Supabase DB triggers in
// supabase/migrations/0014_notify_new_message_trigger.sql (contact_messages)
// and 0023_notify_new_booking_trigger.sql (bookings) whenever a new row
// lands in either table. Fans the event out to every registered admin
// device via Firebase Cloud Messaging (see src/lib/adminPush.ts).
//
// Required server-only env vars: WEBHOOK_SECRET plus the FIREBASE_* trio.

interface ContactMessageRecord {
  id: string;
  name: string;
  phone: string;
  message: string;
}

interface BookingRecord {
  id: string;
  name: string;
  phone: string;
  visit_date: string;
  guest_count?: number;
  visitor_type?: "school" | "delegation" | "personal" | "press" | "other";
}

const VISITOR_TYPE_LABELS: Record<NonNullable<BookingRecord["visitor_type"]>, string> = {
  school: "خوێندنگە / زانکۆ",
  delegation: "سەردانی وەفدی فەرمی",
  personal: "کەسی",
  press: "ڕۆژنامەوانی",
  other: "هیتر",
};

// The 0014/0018 contact_messages trigger predates this "table" field and
// never sends it — so its absence means "contact_messages" for backward
// compatibility. The booking trigger (0023) always sends "bookings"
// explicitly.
type NotifyBody =
  | { table?: "contact_messages"; record: ContactMessageRecord }
  | { table: "bookings"; record: BookingRecord };

function buildNotification(body: NotifyBody): { title: string; body: string; url: string } {
  if (body.table === "bookings") {
    const parts = [`بەرواری سەردان: ${body.record.visit_date}`];
    if (body.record.visitor_type) {
      const guests = body.record.guest_count ?? 1;
      parts.push(`${VISITOR_TYPE_LABELS[body.record.visitor_type]} · ${guests} کەس`);
    }
    return {
      title: `داواکاری سەردانی نوێ لە ${body.record.name}`,
      body: parts.join(" — "),
      url: "/admin/bookings",
    };
  }

  const snippet =
    body.record.message.length > 100 ? `${body.record.message.slice(0, 100)}…` : body.record.message;
  return {
    title: `پەیامی نوێ لە ${body.record.name}`,
    body: snippet,
    url: "/admin/messages",
  };
}

export async function POST(request: Request) {
  if (request.headers.get("x-webhook-secret") !== process.env.WEBHOOK_SECRET) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as NotifyBody | null;
  if (!body?.record) {
    return NextResponse.json({ ok: false, error: "missing_record" }, { status: 400 });
  }

  try {
    const { sent } = await sendAdminPush(buildNotification(body));
    return NextResponse.json({ ok: true, sent });
  } catch {
    return NextResponse.json({ ok: false, error: "send_failed" }, { status: 500 });
  }
}
