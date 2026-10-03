import type { SiteProfileRow } from "@/lib/supabase/database.types";

/**
 * The shipped cut-out pieces (trimmed WebPs in public/images/background)
 * that cross-fade in the corners of every public page's background until an
 * admin saves their own list on /admin/profile. Ordered so the look-alikes
 * (xoragry/xoragry2) are never on screen together — see PaintCanvas.tsx.
 */
export const backgroundDefaults: string[] = [
  "anfal",
  "xoragry",
  "koraw",
  "xoragry2",
  "peshmarga",
  "1",
  "awenakan",
  "minwtaqamany",
  "5",
  "isis",
  "zindanyakan",
].map((name) => `/images/background/${name}.webp`);

/** Null column = never saved, so the shipped set; an empty array is an
 * explicit "no pieces" and stays empty. */
export function backgroundImageUrls(profile: SiteProfileRow | null): string[] {
  return profile?.background_image_urls ?? backgroundDefaults;
}
