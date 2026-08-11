"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

export async function signOut() {
  (await cookies()).delete(ADMIN_COOKIE_NAME);
  redirect("/admin/login");
}

/**
 * Registers (or re-confirms) this browser/device's FCM token so the
 * notify-new-message Edge Function knows to push to it. There's no
 * per-user identity in this app (single shared admin password — see
 * src/lib/adminAuth.ts), so every registered device is just "an admin
 * device"; requireAdminSession() is what stands in for "only a
 * verified admin session can register one".
 */
export async function saveAdminPushToken(token: string) {
  await requireAdminSession();
  if (!token) throw new Error("Missing push token.");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("admin_push_tokens")
    .upsert({ token }, { onConflict: "token" });
  if (error) throw new Error(error.message);
}
