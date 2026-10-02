import "server-only";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  DEFAULT_NOTIFICATION_SOUND,
  isNotificationSound,
  soundChannelId,
  soundResource,
  type NotificationSoundId,
} from "@/lib/notificationSounds";

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

export interface AdminPushResult {
  /** Devices targeted. */
  total: number;
  sent: number;
  failed: number;
}

/** The sound picked under /admin/settings. Falls back to the default if the
 * 0068 column isn't there yet, so pushes never fail over a missing setting. */
async function pickedSound(supabase: ReturnType<typeof createAdminClient>): Promise<NotificationSoundId> {
  const { data } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();
  const sound = (data as { notification_sound?: unknown } | null)?.notification_sound;
  return isNotificationSound(sound) ? sound : DEFAULT_NOTIFICATION_SOUND;
}

/** Sends `push` to every registered admin device — or only `onlyToken`, when
 * it is one of them — with the picked sound, and prunes tokens FCM reports
 * as unregistered. */
export async function sendAdminPush(push: AdminPush, onlyToken?: string): Promise<AdminPushResult> {
  const supabase = createAdminClient();
  let query = supabase.from("admin_push_tokens").select("id, token");
  if (onlyToken) query = query.eq("token", onlyToken);

  const [{ data: tokens, error }, sound] = await Promise.all([query, pickedSound(supabase)]);
  if (error) {
    console.error("[adminPush] failed to load push tokens", error.message);
    throw new Error("load_tokens_failed");
  }
  if (!tokens || tokens.length === 0) return { total: 0, sent: 0, failed: 0 };

  const messaging = getMessaging(getFirebaseAdminApp());
  const staleTokenIds: string[] = [];
  let failed = 0;

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
          android: {
            // "high" lets FCM wake the device out of Doze immediately
            // instead of batching the message into the next maintenance
            // window — the "arrives only when I open the app" symptom.
            priority: "high",
            // A booking alert that's a day late is worse than none.
            ttl: 24 * 60 * 60 * 1000,
            notification: {
              // Android 8+ takes sound and importance from the channel
              // (one per sound, see notificationSounds.ts). The sound field
              // covers Android 7. A phone on an older APK that lacks the
              // picked channel falls back to FCM's default channel.
              channelId: soundChannelId(sound),
              sound: soundResource(sound) ?? "default",
              priority: "max",
              visibility: "public",
            },
          },
        });
      } catch (err) {
        failed++;
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

  return { total: tokens.length, sent: tokens.length - failed, failed };
}
