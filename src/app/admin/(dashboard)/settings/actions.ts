"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { SystemSettingsRow } from "@/lib/supabase/database.types";

export async function getSystemSettings(): Promise<SystemSettingsRow> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("system_settings").select("*").eq("id", 1).maybeSingle();

  if (error) throw new Error(error.message);
  return data ?? { id: 1, enable_face_scan: false, updated_at: new Date().toISOString() };
}

export async function updateFaceScanSetting(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const enableFaceScan = formData.get("enable_face_scan") === "on";

  const { error } = await supabase
    .from("system_settings")
    .upsert({ id: 1, enable_face_scan: enableFaceScan, updated_at: new Date().toISOString() });

  if (error) throw new Error(error.message);
  revalidatePath("/admin/settings");
  revalidatePath("/");
}
