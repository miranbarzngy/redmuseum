import "server-only";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createAdminClient } from "@/lib/supabase/admin";

// Shared Firebase Cloud Messaging fan-out to every device in
// public.admin_push_tokens. Used by /api/notify-admin (new booking / new
// message, fired by DB triggers) and /api/booking/reminders (the daily
// "you forgot to mark a visit" nudge).
//
// Required server-only env vars:
//   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY

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

export interface AdminPush {
  title: string;
  body: string;
  /** In-app path the notification tap should open, e.g. "/admin/bookings". */
  url: string;
}

/** Sends `push` to every registered admin device and prunes tokens FCM
 * reports as unregistered. Returns how many devices were reached. */
export async function sendAdminPush(push: AdminPush): Promise<{ sent: number }> {
  const supabase = createAdminClient();
  const { data: tokens, error } = await supabase.from("admin_push_tokens").select("id, token");
  if (error) {
    console.error("[adminPush] failed to load push tokens", error.message);
    throw new Error("load_tokens_failed");
  }
  if (!tokens || tokens.length === 0) return { sent: 0 };

  const messaging = getMessaging(getFirebaseAdminApp());
  const staleTokenIds: string[] = [];

  await Promise.all(
    tokens.map(async ({ id, token }) => {
      try {
        await messaging.send({
          token,
          // A real "notification" block (not data-only) is what lets
          // Android's OS show a status-bar notification even when the app
          // process is backgrounded or killed.
          notification: { title: push.title, body: push.body },
          data: { url: push.url },
          android: { priority: "high" },
        });
      } catch (err) {
        const code = (err as { code?: string }).code;
        if (code === "messaging/registration-token-not-registered") {
          staleTokenIds.push(id);
        } else {
          console.error("[adminPush] FCM send failed", err);
        }
      }
    })
  );

  if (staleTokenIds.length > 0) {
    await supabase.from("admin_push_tokens").delete().in("id", staleTokenIds);
  }

  return { sent: tokens.length - staleTokenIds.length };
}
