import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { HomePage } from "@/components/HomePage";
import { HOME_SECTION_ROUTE_SLUGS, homeSectionIdForSlug } from "@/lib/homeSections";

// The homepage again, opened at one section — /ku/museums, /en/gallery, …
// These are the URLs HomeSectionUrlSync shows while scrolling, so a reload
// or a shared link lands back on the same section. Same 60s ISR window as
// /[locale]; the admin's revalidatePath("/[locale]", "layout") covers it.
export const revalidate = 60;
// Any other slug is a 404, not a homepage with nothing to scroll to.
export const dynamicParams = false;

export function generateStaticParams() {
  return HOME_SECTION_ROUTE_SLUGS.map((section) => ({ section }));
}

export default async function HomeSectionPage({
  params,
}: {
  params: Promise<{ locale: string; section: string }>;
}) {
  const { locale, section } = await params;
  const sectionId = homeSectionIdForSlug(section);
  if (!sectionId) notFound();

  setRequestLocale(locale);
  return <HomePage initialSectionId={sectionId} />;
}
