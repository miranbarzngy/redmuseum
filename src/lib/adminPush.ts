import "server-only";
import { cert, getApps, getApp, initializeApp } from "firebase-admin/app";
import { getMessaging } from "firebase-admin/messaging";
import { createAdminClient } from "@/lib/supabase/admin";
import { hasPermission, type Permission } from "@/lib/permissions";
import {
  DEFAULT_NOTIFICATION_SOUND,
  isNotificationSound,
  soundChannelId,
  soundResource,
  type NotificationSoundId,
} from "@/lib/notificationSounds";

// Shared Firebase Cloud Messaging fan-out to the admin devices in
// public.admin_push_tokens. Used by /api/notify-admin (new booking / new
// message, fired by DB triggers), /api/booking/reminders (the daily
// "you forgot to mark a visit" nudge) and the Settings test push.
//
// Every token belongs to the admin who registered it (user_id, 0071), and
// a push only goes to the devices its audience allows — booking pushes carry
// visitors' names, message pushes the start of their message.
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

/**
 * Who a push goes to:
 *   - `permission` — the devices of every active admin whose role holds that
 *     permission. Checked when the push is sent, not when the device was
 *     registered, so deactivating someone or editing their role applies to
 *     the very next push.
 *   - `userId` — one admin's own devices (the Settings test push), or just
 *     `token` among them.
 */
export type PushAudience = { permission: Permission } | { userId: string; token?: string };

// database.types.ts is hand-written with no Relationships metadata, so the
// joined select's shape is described locally (same pattern as adminAuth.ts).
type TokenWithOwner = {
  id: string;
  token: string;
  owner: { is_active: boolean; role: { permissions: string[] } | null } | null;
};

async function audienceTokens(
  supabase: ReturnType<typeof createAdminClient>,
  audience: PushAudience
): Promise<{ id: string; token: string }[]> {
  if ("userId" in audience) {
    let query = supabase.from("admin_push_tokens").select("id, token").eq("user_id", audience.userId);
    if (audience.token) query = query.eq("token", audience.token);
    const { data, error } = await query;
    if (error) throw error;
    return data ?? [];
  }

  const { data, error } = await supabase
    .from("admin_push_tokens")
    .select("id, token, owner:admin_users(is_active, role:admin_roles(permissions))");
  if (error) throw error;
  return (data as unknown as TokenWithOwner[]).filter(
    ({ owner }) => owner?.is_active && owner.role && hasPermission(owner.role.permissions, audience.permission)
  );
}

/** The sound picked under /admin/settings. Falls back to the default if the
 * 0068 column isn't there yet, so pushes never fail over a missing setting. */
async function pickedSound(supabase: ReturnType<typeof createAdminClient>): Promise<NotificationSoundId> {
  const { data } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();
  const sound = (data as { notification_sound?: unknown } | null)?.notification_sound;
  return isNotificationSound(sound) ? sound : DEFAULT_NOTIFICATION_SOUND;
}

/** Sends `push` to the devices `audience` allows, with the picked sound, and
 * prunes tokens FCM reports as unregistered. */
export async function sendAdminPush(push: AdminPush, audience: PushAudience): Promise<AdminPushResult> {
  const supabase = createAdminClient();

  const [tokens, sound] = await Promise.all([
    audienceTokens(supabase, audience).catch((err: { message?: string }) => {
      console.error("[adminPush] failed to load push tokens", err.message);
      throw new Error("load_tokens_failed");
    }),
    pickedSound(supabase),
  ]);
  if (tokens.length === 0) return { total: 0, sent: 0, failed: 0 };

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
              // "private", not "public": a locked phone set to hide
              // sensitive notification content shows only that a push
              // arrived, not the visitor's name or message. "public" forced
              // the full text onto the lock screen regardless.
              visibility: "private",
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
