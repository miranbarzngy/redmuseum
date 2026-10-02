"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Capacitor, type PluginListenerHandle } from "@capacitor/core";
import { PushNotifications, type ActionPerformed, type Token } from "@capacitor/push-notifications";
import { saveAdminPushToken } from "../actions";
import { NOTIFICATION_SOUNDS, soundChannelId, soundResource } from "@/lib/notificationSounds";

/** This device's FCM token, so the Settings test button can target it. */
export const PUSH_TOKEN_KEY = "admin_push_token";

/** One channel per custom sound (a channel's sound is fixed once created).
 * "default" is the admin_alerts channel MainActivity already creates.
 * Re-creating an existing channel keeps its settings, so this is safe on
 * every launch. */
async function ensureSoundChannels() {
  for (const s of NOTIFICATION_SOUNDS) {
    const resource = soundResource(s.id);
    if (!resource) continue;
    await PushNotifications.createChannel({
      id: soundChannelId(s.id),
      name: `Bookings & messages — ${s.label}`,
      importance: 5,
      sound: `${resource}.wav`,
      vibration: true,
      visibility: 1,
    }).catch(() => {});
  }
}

/**
 * Renders nothing. Only does anything when actually running inside the
 * native Capacitor Android shell (Capacitor.isNativePlatform()) — a plain
 * browser tab has no native push bridge to talk to, so this silently no-ops
 * there rather than throwing.
 *
 * On mount: requests native notification permission, registers with FCM via
 * the native plugin, hands the resulting device token to
 * saveAdminPushToken(), and wires up tap-to-open so tapping the OS status
 * bar notification navigates straight to /admin/messages.
 */
export function NativePushBridge() {
  const router = useRouter();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const handles: PluginListenerHandle[] = [];

    async function setup() {
      const current = await PushNotifications.checkPermissions();
      let granted = current.receive === "granted";

      if (!granted && current.receive !== "denied") {
        const requested = await PushNotifications.requestPermissions();
        granted = requested.receive === "granted";
      }
      if (!granted) return;

      handles.push(
        await PushNotifications.addListener("registration", (token: Token) => {
          try {
            localStorage.setItem(PUSH_TOKEN_KEY, token.value);
          } catch {}
          saveAdminPushToken(token.value).catch(() => {
            // Best-effort — a failed save just means this device won't
            // receive pushes until the next successful registration.
          });
        }),
        await PushNotifications.addListener("registrationError", (err) => {
          console.error("[push] native registration failed", err);
        }),
        await PushNotifications.addListener("pushNotificationReceived", () => {
          // App was already open in the foreground when the push arrived —
          // refresh server-rendered data (unread badge, etc.) instead of
          // waiting for the next navigation.
          router.refresh();
        }),
        await PushNotifications.addListener(
          "pushNotificationActionPerformed",
          (action: ActionPerformed) => {
            const url = (action.notification.data?.url as string | undefined) ?? "/admin/messages";
            router.push(url);
          }
        )
      );

      await ensureSoundChannels();
      await PushNotifications.register();
    }

    setup();

    return () => {
      handles.forEach((h) => h.remove());
    };
  }, [router]);

  return null;
}
