import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
import { MuseumPhotoMarquee } from "@/components/sections/MuseumPhotoMarquee";
import { Link } from "@/i18n/navigation";
import { getBiographyBlocks } from "@/lib/data/biography";
import { pickSectionTitle } from "@/lib/museumSectionTitle";
import type { Locale } from "@/i18n/routing";
import type { BiographyBlockRow } from "@/lib/supabase/database.types";

// Same 60s ISR window as the homepage — these detail pages read the exact
// same biography_blocks rows, and admin mutations revalidatePath("/[locale]",
// "layout") which covers this route too.
export const revalidate = 60;

const ACCENT = "#850B10";

function pickBody(block: BiographyBlockRow, locale: Locale): string {
  const localized = block[`body_${locale}`];
  return (
    (localized && localized.trim()) ||
    block.body_ku.trim() ||
    block.body_en.trim() ||
    block.body_ar.trim() ||
    ""
  );
}

/**
 * Resolves a section id against the full ordered list so the detail page
 * can show its position ("Section 2 of 5") and prev/next links — the same
 * ordering the homepage section numbers them by.
 */
async function loadSection(id: string) {
  const blocks = await getBiographyBlocks();
  const index = blocks.findIndex((b) => b.id === id);
  if (index === -1) return null;

  return {
    block: blocks[index],
    index,
    total: blocks.length,
    prev: index > 0 ? blocks[index - 1] : null,
    next: index < blocks.length - 1 ? blocks[index + 1] : null,
  };
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const section = await loadSection(id);
  if (!section) return {};

  const t = await getTranslations({ locale, namespace: "museum" });
  const number = String(section.index + 1);
  const body = pickBody(section.block, locale as Locale);
  const title = pickSectionTitle(section.block, locale as Locale);

  return {
    title: title ? t("metaTitleNamed", { name: title }) : t("metaTitle", { number }),
    description: body ? body.slice(0, 160) : undefined,
  };
}

export default async function MuseumSectionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  const section = await loadSection(id);
  if (!section) notFound();

  const { block, index, prev, next } = section;
  const t = await getTranslations({ locale, namespace: "museum" });
  const number = String(index + 1);
  const body = pickBody(block, locale as Locale);
  const title = pickSectionTitle(block, locale as Locale);

  // The cover is its own field; image_urls holds the additional photos.
  // Filter the cover out of the grid defensively in case an older save
  // folded it into the list.
  const cover = block.image_url ?? null;
  const morePhotos = (block.image_urls ?? []).filter((url) => url && url !== cover);

  return (
    <>
      <HeaderServer solid />
      <ScrollExperience>
        <main className="min-h-screen pb-24 pt-28 sm:pt-32">
          <div className="container-art section-px flex flex-col gap-12">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
              <div className="flex w-full flex-col items-center gap-3 text-center">
                <div className="flex items-center justify-center gap-3">
                  <span
                    className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-fluid-base font-bold text-white"
                    style={{ backgroundColor: ACCENT }}
                  >
                    {number}
                  </span>
                  <h1 className="font-display text-fluid-2xl font-semibold leading-tight text-ink">
                    {title || t("sectionLabel", { number })}
                  </h1>
                </div>
                <p className="whitespace-pre-line text-xs leading-[2.4] text-ink-soft sm:text-fluid-sm">
                  {body || t("noContent")}
                </p>
              </div>
            </div>

            {morePhotos.length > 0 && (
              <section className="relative left-1/2 right-1/2 -mx-[50vw] flex w-screen flex-col gap-5">
                <MuseumPhotoMarquee photos={morePhotos} />
              </section>
            )}

            {(prev || next) && (
              <nav className="mt-4 flex flex-col gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:justify-between">
                {prev ? (
                  <Link
                    href={`/museum/${prev.id}`}
                    className="group inline-flex items-center gap-2 rounded-full bg-[#850B10] px-4 py-2 text-fluid-sm font-medium text-white transition-opacity hover:opacity-90"
                  >
                    <ArrowLeft
                      size={16}
                      className="icon-flip transition-transform duration-300 group-hover:-translate-x-1"
                    />
                    {t("prev")}
                  </Link>
                ) : (
                  <span aria-hidden />
                )}
                {next && (
                  <Link
                    href={`/museum/${next.id}`}
                    className="group inline-flex items-center gap-2 rounded-full bg-[#850B10] px-4 py-2 text-fluid-sm font-medium text-white transition-opacity hover:opacity-90 sm:flex-row-reverse sm:text-end"
                  >
                    <ArrowRight
                      size={16}
                      className="icon-flip transition-transform duration-300 group-hover:translate-x-1"
                    />
                    {t("next")}
                  </Link>
                )}
              </nav>
            )}
          </div>
        </main>
        <Footer />
      </ScrollExperience>
    </>
  );
}
