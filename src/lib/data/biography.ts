import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { BiographyBlockRow, BiographyIntroRow } from "@/lib/supabase/database.types";

/** Null if the admin hasn't saved anything yet — callers fall back to the shipped translation strings. */
export async function getBiographyIntro(): Promise<BiographyIntroRow | null> {
  const supabase = createClient();
  const { data, error } = await supabase.from("biography_intro").select("*").eq("id", 1).maybeSingle();

  if (error) {
    console.error("[data] failed to load biography intro", error.message);
    return null;
  }

  return data;
}

/** Empty array if none saved yet — callers fall back to the shipped paragraphs + seeded placeholder art. */
export async function getBiographyBlocks(): Promise<BiographyBlockRow[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("biography_blocks")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) {
    console.error("[data] failed to load biography blocks", error.message);
    return [];
  }

  return data ?? [];
}
