import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { GalleryRow, GalleryCategoryRow } from "@/lib/supabase/database.types";
import type { LocalizedText } from "@/data/types";

// database.types.ts is hand-written and has no Relationships metadata, so
// the joined select's shape below must be described locally (see the same
// pattern previously used in src/lib/data/press.ts).
type GalleryRowWithCategory = GalleryRow & { category: GalleryCategoryRow | null };

export interface GalleryCategory {
  id: string;
  slug: string;
  label: LocalizedText;
  sortOrder: number;
}

export interface GalleryImage {
  id: string;
  imageUrl: string;
  title: string | null;
}

export interface GalleryGroup {
  category: GalleryCategory;
  images: GalleryImage[];
}

function normalizeImageUrl(url: string): string {
  return /^https?:\/\//.test(url) ? url : `/${url.replace(/^\/+/, "")}`;
}

function toGalleryImage(row: GalleryRow): GalleryImage {
  return { id: row.id, imageUrl: normalizeImageUrl(row.image_url), title: row.title };
}

function toGalleryCategory(row: GalleryCategoryRow): GalleryCategory {
  return {
    id: row.id,
    slug: row.slug,
    label: { ku: row.label_ku, en: row.label_en, ar: row.label_ar },
    sortOrder: row.sort_order,
  };
}

export async function getGalleryGroups(): Promise<GalleryGroup[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gallery")
    .select("*, category:gallery_categories(*)")
    .eq("is_active", true)
    .order("display_order", { ascending: true });

  if (error) {
    console.error("[data] failed to load gallery images", error.message);
    return [];
  }

  const byCategory = new Map<string, GalleryGroup>();

  for (const row of (data as unknown as GalleryRowWithCategory[] | null) ?? []) {
    // A gallery image whose category was deleted out from under it
    // (shouldn't happen — categories are FK-protected from deletion while
    // in use — but defend against it anyway rather than crash the section).
    if (!row.category) continue;

    let group = byCategory.get(row.category.id);
    if (!group) {
      group = { category: toGalleryCategory(row.category), images: [] };
      byCategory.set(row.category.id, group);
    }
    group.images.push(toGalleryImage(row));
  }

  return [...byCategory.values()].sort((a, b) => a.category.sortOrder - b.category.sortOrder);
}

export async function getGalleryCategories(): Promise<GalleryCategory[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("gallery_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[data] failed to load gallery categories", error.message);
    return [];
  }

  return (data ?? []).map(toGalleryCategory);
}
