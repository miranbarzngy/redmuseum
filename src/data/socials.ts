import type { SiteProfileRow } from "@/lib/supabase/database.types";

export interface SocialLink {
  type: "instagram" | "facebook" | "x" | "youtube";
  label: string;
  href: string;
}

// Shipped fallbacks — used until an admin saves their own URLs on
// /admin/profile (see resolveSocials + the migration 0040 columns).
export const socials: SocialLink[] = [
  { type: "instagram", label: "Instagram", href: "https://instagram.com/amnasuraka" },
  { type: "facebook", label: "Facebook", href: "https://facebook.com/amnasuraka" },
  { type: "x", label: "X / Twitter", href: "https://x.com/amnasuraka" },
  { type: "youtube", label: "YouTube", href: "https://youtube.com/@amnasuraka" },
];

const SOCIAL_COLUMN: Record<SocialLink["type"], keyof SiteProfileRow> = {
  instagram: "social_instagram_url",
  facebook: "social_facebook_url",
  x: "social_x_url",
  youtube: "social_youtube_url",
};

/**
 * The social buttons to actually render, given the saved site profile:
 *   - column NULL  → never edited → keep the shipped default URL
 *   - column set   → use the admin's URL
 *   - column blank → admin cleared it → drop that button
 */
export function resolveSocials(profile: SiteProfileRow | null): SocialLink[] {
  return socials
    .map((s) => {
      const saved = profile?.[SOCIAL_COLUMN[s.type]] as string | null | undefined;
      if (saved == null) return s;
      const href = saved.trim();
      return href ? { ...s, href } : null;
    })
    .filter((s): s is SocialLink => s !== null);
}
