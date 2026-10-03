"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, getAdminSession, requireAdminSession, revokeCurrentSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

/** Signs out server-side. Inside the native app the form also carries this
 * phone's push token (see AdminShell), so the phone stops receiving pushes
 * for an admin who is no longer signed in on it. */
export async function signOut(formData?: FormData) {
  const pushToken = formData?.get("push_token");
  if (typeof pushToken === "string" && pushToken) {
    const session = await getAdminSession();
    if (session) {
      const { error } = await createAdminClient()
        .from("admin_push_tokens")
        .delete()
        .eq("token", pushToken)
        .eq("user_id", session.id);
      if (error) console.error("[signOut] failed to unregister push device", error.message);
    }
  }

  await revokeCurrentSession();
  (await cookies()).delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

/**
 * Registers (or re-confirms) this device's FCM token for the signed-in
 * admin. NativePushBridge calls this on every launch of the native app, so
 * a phone that changes hands moves to whoever signed in on it last.
 *
 * Any signed-in admin may register: what a device then receives is decided
 * per push in src/lib/adminPush.ts, against its owner's role at that moment
 * — a booking push only reaches owners with bookings:manage, and so on.
 */
export async function saveAdminPushToken(token: string) {
  const session = await requireAdminSession();
  if (typeof token !== "string" || !token || token.length > 4096) {
    throw new Error("Invalid push token.");
  }

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_push_tokens")
    .upsert({ token, user_id: session.id }, { onConflict: "token" });
  if (error) throw new Error(error.message);
}
