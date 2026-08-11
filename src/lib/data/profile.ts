import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { SiteProfileRow } from "@/lib/supabase/database.types";

/** Null if the admin hasn't saved anything yet — callers fall back to the shipped translation strings. */
export async function getSiteProfile(): Promise<SiteProfileRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("site_profile").select("*").eq("id", 1).maybeSingle();

  if (error) {
    console.error("[data] failed to load site profile", error.message);
    return null;
  }

  return data;
}
