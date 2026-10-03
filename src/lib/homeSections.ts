// The homepage's sections, top to bottom, and the URL each one shows in the
// address bar while it's on screen (/ku/museums, /en/gallery, …).
// HomeSectionUrlSync keeps the URL in step with scrolling, and the
// [locale]/[section] route serves the homepage at each of these URLs,
// opened at that section, so a reload or shared link lands in the same place.
export const HOME_SECTIONS = [
  { id: "hero", slug: "home" },
  { id: "history", slug: "history" },
  { id: "biography", slug: "museums" },
  { id: "media", slug: "gallery" },
  // /contact is also the standalone contact page, which wins over the
  // [section] route — so this URL, reloaded or shared, opens that page
  // rather than the homepage's shorter contact section.
  { id: "contact", slug: "contact" },
] as const;

export type HomeSectionId = (typeof HOME_SECTIONS)[number]["id"];

/** Slugs the [locale]/[section] route serves — every one without its own page. */
export const HOME_SECTION_ROUTE_SLUGS: string[] = HOME_SECTIONS.map((s) => s.slug).filter(
  (slug) => slug !== "contact"
);

/** Locale-less path for a section id, for next-intl's router/Link
 * (e.g. "biography" → "/museums"). Unknown ids fall back to the homepage. */
export function homeSectionHref(id: string): string {
  const section = HOME_SECTIONS.find((s) => s.id === id);
  return section ? `/${section.slug}` : "/";
}

export function homeSectionIdForSlug(slug: string): HomeSectionId | null {
  return HOME_SECTIONS.find((s) => s.slug === slug)?.id ?? null;
}
