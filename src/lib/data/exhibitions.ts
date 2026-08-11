import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { ExhibitionEntry } from "@/data/exhibitions";
import type { ExhibitionRow } from "@/lib/supabase/database.types";

function toExhibitionEntry(row: ExhibitionRow): ExhibitionEntry {
  return {
    id: row.id,
    year: row.year,
    title: { ku: row.title_ku, en: row.title_en, ar: row.title_ar },
    description: { ku: row.details_ku, en: row.details_en, ar: row.details_ar },
  };
}

export async function getExhibitions(): Promise<ExhibitionEntry[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("exhibitions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[data] failed to load exhibitions", error.message);
    return [];
  }

  return (data ?? []).map(toExhibitionEntry);
}
