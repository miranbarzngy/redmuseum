import type { LocalizedText } from "./types";

/** A press category, admin-managed data rather than a fixed set of
 * code-level values — see supabase/migrations/0009_press_categories.sql. */
export interface PressCategory {
  id: string;
  slug: string;
  label: LocalizedText;
}

export interface PressItem {
  id: string;
  category: PressCategory;
  outlet: string;
  date: string;
  title: LocalizedText;
  excerpt: LocalizedText;
  href: string;
  imageUrl: string | null;
}
