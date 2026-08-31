import type { Locale } from "@/i18n/routing";

type TitleFields = {
  title_ku?: string | null;
  title_en?: string | null;
  title_ar?: string | null;
};

/**
 * A museum section's own name in the active locale, falling back across the
 * other locales. Returns "" when the section hasn't been named yet —
 * callers then fall back to a numbered label ("Section 1", …).
 */
export function pickSectionTitle(block: TitleFields, locale: Locale): string {
  return (
    (block[`title_${locale}`] || "").trim() ||
    (block.title_ku || "").trim() ||
    (block.title_en || "").trim() ||
    (block.title_ar || "").trim()
  );
}
