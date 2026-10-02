"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SystemSettingsRow } from "@/lib/supabase/database.types";
import { sendAdminPush, type AdminPushResult } from "@/lib/adminPush";
import { isNotificationSound } from "@/lib/notificationSounds";

export async function getSystemSettings(): Promise<SystemSettingsRow> {
  await requireAdminSession(PERMISSIONS.settingsManage);
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? { id: 1, enable_face_scan: false, notification_sound: "default", updated_at: new Date().toISOString() };
}

export async function updateFaceScanSetting(formData: FormData) {
  await requireAdminSession(PERMISSIONS.settingsManage);
  const supabase = createAdminClient();

  const enableFaceScan = formData.get("enable_face_scan") === "on";

  const { error } = await supabase
    .from("system_settings")
    .upsert({ id: 1, enable_face_scan: enableFaceScan, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/");
  redirect("/admin/settings?saved=1");
}

export async function updateNotificationSound(sound: string): Promise<{ ok: boolean }> {
  await requireAdminSession(PERMISSIONS.settingsManage);
  if (!isNotificationSound(sound)) return { ok: false };

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("system_settings")
    .upsert({ id: 1, notification_sound: sound, updated_at: new Date().toISOString() });
  if (error) {
    console.error("[settings] notification sound save failed", error.message);
    return { ok: false };
  }
  revalidatePath("/admin/settings");
  return { ok: true };
}

export type TestPushResult = AdminPushResult | { error: "send_failed" };

/** Sample push with the picked sound. With `token` (the calling phone's)
 * only that device gets it; from a browser, every registered device does. */
export async function sendTestPush(token?: string): Promise<TestPushResult> {
  await requireAdminSession(PERMISSIONS.settingsManage);
  try {
    return await sendAdminPush(
      {
        title: "تاقیکردنەوەی ئاگادارکردنەوە 🔔",
        body: "ئەگەر ئەمە دەبینیت، ئاگادارکردنەوەکان بە باشی کار دەکەن",
        url: "/admin/settings",
      },
      token || undefined
    );
  } catch (err) {
    console.error("[settings] test push failed", err);
    return { error: "send_failed" };
  }
}
