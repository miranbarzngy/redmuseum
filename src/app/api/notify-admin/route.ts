import "server-only";
import { NextResponse } from "next/server";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createAdminClient } from "@/lib/supabase/admin";

// Called by the Supabase DB triggers in
// supabase/migrations/0014_notify_new_message_trigger.sql (contact_messages)
// and 0023_notify_new_booking_trigger.sql (bookings) whenever a new row
// lands in either table. Sends a push notification to every device
// registered in public.admin_push_tokens via Firebase Cloud Messaging,
// using firebase-admin (which handles the OAuth2/service-account exchange
// internally) instead of hand-rolled JWT signing.
//
// Required server-only env vars (see .env.local.example):
//   WEBHOOK_SECRET, FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

interface ContactMessageRecord {
  id: string;
  name: string;
  phone: string;
  type: string;
  message: string;
}

interface BookingRecord {
  id: string;
  name: string;
  phone: string;
  visit_date: string;
}

// The 0014/0018 contact_messages trigger predates this "table" field and
// never sends it — so its absence means "contact_messages" for backward
// compatibility. The booking trigger (0023) always sends "bookings"
// explicitly.
type NotifyBody =
  | { table?: "contact_messages"; record: ContactMessageRecord }
  | { table: "bookings"; record: BookingRecord };

function getFirebaseAdminApp() {
  if (getApps().length) return getApp();

  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    }),
  });
}

function buildNotification(body: NotifyBody): { title: string; body: string; url: string } {
  if (body.table === "bookings") {
    return {
      title: `داواکاری سەردانی نوێ لە ${body.record.name}`,
      body: `بەرواری سەردان: ${body.record.visit_date}`,
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

  const supabase = createAdminClient();
  const { data: tokens, error } = await supabase.from("admin_push_tokens").select("id, token");
  if (error) {
    console.error("[notify-admin] failed to load push tokens", error.message);
    return NextResponse.json({ ok: false, error: "load_tokens_failed" }, { status: 500 });
  }
  if (!tokens || tokens.length === 0) {
    return NextResponse.json({ ok: true, sent: 0 });
  }

  const messaging = getMessaging(getFirebaseAdminApp());
  const notification = buildNotification(body);

  const staleTokenIds: string[] = [];

  await Promise.all(
    tokens.map(async ({ id, token }) => {
      try {
        await messaging.send({
          token,
          // A real "notification" block (not data-only) is what lets
          // Android's OS show a status-bar notification even when the app
          // process is backgrounded or killed — Capacitor's push plugin is
          // built specifically to bridge this correctly, unlike the raw
          // browser service worker this replaced.
          notification: { title: notification.title, body: notification.body },
          data: { url: notification.url },
          android: { priority: "high" },
        });
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "messaging/registration-token-not-registered") {
          staleTokenIds.push(id);
        } else {
          console.error("[notify-admin] FCM send failed", err);
        }
      }
    })
  );

  if (staleTokenIds.length > 0) {
    await supabase.from("admin_push_tokens").delete().in("id", staleTokenIds);
  }

  return NextResponse.json({ ok: true, sent: tokens.length - staleTokenIds.length });
}
