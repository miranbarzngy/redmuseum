import "server-only";
import { createClient } from "@/lib/supabase/server";

/** Defaults to false (face scan off) if the row is missing or the read fails. */
export async function getFaceScanEnabled(): Promise<boolean> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("system_settings")
    .select("enable_face_scan")
    .eq("id", 1)
    .maybeSingle();

  if (error) {
    console.error("[data] failed to load system settings", error.message);
    return false;
  }

  return data?.enable_face_scan ?? false;
}
