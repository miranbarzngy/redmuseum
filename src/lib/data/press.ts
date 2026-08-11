import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { PressCategory, PressItem } from "@/data/press";
import type { PressMediaRow, PressCategoryRow } from "@/lib/supabase/database.types";

// database.types.ts is hand-written (not CLI-introspected), so it has no
// real Relationships metadata for Supabase's client to infer a joined
// select's shape from — this local type describes the actual shape of the
// "*, category:press_categories(...)" query below.
type PressMediaWithCategory = PressMediaRow & {
  category: PressCategoryRow | null;
};

function toPressCategory(row: PressCategoryRow): PressCategory {
  return {
    id: row.id,
    slug: row.slug,
    label: { ku: row.label_ku, en: row.label_en, ar: row.label_ar },
  };
}

function toPressItem(row: PressMediaWithCategory): PressItem | null {
  // A press item whose category was deleted out from under it (shouldn't
  // happen — categories are FK-protected from deletion while in use — but
  // defend against it anyway rather than crash the whole media section).
  if (!row.category) return null;

  return {
    id: row.id,
    category: toPressCategory(row.category),
    outlet: row.source,
    date: row.date,
    title: { ku: row.title_ku, en: row.title_en, ar: row.title_ar },
    excerpt: { ku: row.excerpt_ku, en: row.excerpt_en, ar: row.excerpt_ar },
    href: row.url,
    imageUrl: row.image_url,
  };
}

export async function getPressItems(): Promise<PressItem[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("press_media")
    .select("*, category:press_categories(*)")
    .order("date", { ascending: false });

  if (error) {
    console.error("[data] failed to load press media", error.message);
    return [];
  }

  return ((data as unknown as PressMediaWithCategory[] | null) ?? [])
    .map(toPressItem)
    .filter((item): item is PressItem => item !== null);
}

export async function getPressItem(id: string): Promise<PressItem | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("press_media")
    .select("*, category:press_categories(*)")
    .eq("id", id)
    .single();

  if (error || !data) return null;

  return toPressItem(data as unknown as PressMediaWithCategory);
}

export async function getPressCategories(): Promise<PressCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("press_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[data] failed to load press categories", error.message);
    return [];
  }

  return (data ?? []).map(toPressCategory);
}
