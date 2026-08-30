import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
import { ArtworkPlaceholder } from "@/components/ui/ArtworkPlaceholder";
import { Link } from "@/i18n/navigation";
import { getBiographyBlocks } from "@/lib/data/biography";
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

  return {
    title: t("metaTitle", { number }),
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

  const { block, index, total, prev, next } = section;
  const t = await getTranslations({ locale, namespace: "museum" });
  const number = String(index + 1);
  const body = pickBody(block, locale as Locale);

  // Ordered photo gallery, falling back to the legacy single portrait for
  // rows saved before the gallery column existed. The first entry is the
  // cover shown large; any others render in the grid below.
  const photos =
    block.image_urls && block.image_urls.length > 0
      ? block.image_urls
      : block.image_url
        ? [block.image_url]
        : [];
  const cover = photos[0] ?? null;
  const morePhotos = photos.slice(1);

  return (
    <>
      <HeaderServer solid />
      <ScrollExperience>
        <main className="min-h-screen pb-24 pt-28 sm:pt-32">
          <div className="container-art section-px flex flex-col gap-12">
            <Link
              href="/#biography"
              className="inline-flex items-center gap-2 text-fluid-sm font-medium text-ink-soft transition-colors hover:text-[#850B10]"
            >
              <ArrowLeft size={16} className="icon-flip" />
              {t("backToSections")}
            </Link>

            <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-16">
              <div className="w-full lg:w-1/2">
                <div className="relative aspect-[4/3] w-full overflow-hidden rounded-3xl bg-white shadow-soft ring-1 ring-ink/5">
                  {cover ? (
                    <Image
                      src={cover}
                      alt=""
                      fill
                      sizes="(min-width: 1024px) 50vw, 100vw"
                      className="object-contain"
                      priority
                    />
                  ) : (
                    <ArtworkPlaceholder seed={`bio-${block.id}`} className="h-full w-full" />
                  )}
                </div>
              </div>

              <div className="flex w-full flex-col gap-5 lg:w-1/2">
                <span
                  className="inline-flex h-14 w-14 items-center justify-center rounded-full font-display text-fluid-xl font-bold text-white"
                  style={{ backgroundColor: ACCENT }}
                >
                  {number}
                </span>
                <p className="text-fluid-xs uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
                  {t("ofTotal", { number, total: String(total) })}
                </p>
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft sm:text-fluid-base">
                  {body || t("noContent")}
                </p>
              </div>
            </div>

            {morePhotos.length > 0 && (
              <section className="flex flex-col gap-5">
                <h2 className="font-display text-fluid-lg font-semibold text-ink">
                  {t("photos", { count: String(photos.length) })}
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
                  {morePhotos.map((url, i) => (
                    <div
                      key={url}
                      className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-white ring-1 ring-ink/5"
                    >
                      <Image
                        src={url}
                        alt=""
                        fill
                        sizes="(min-width: 640px) 33vw, 50vw"
                        className="object-cover"
                        loading={i < 3 ? "eager" : "lazy"}
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {(prev || next) && (
              <nav className="mt-4 flex flex-col gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:justify-between">
                {prev ? (
                  <Link
                    href={`/museum/${prev.id}`}
                    className="group inline-flex items-center gap-2 text-fluid-sm font-medium text-ink-soft transition-colors hover:text-[#850B10]"
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
                    className="group inline-flex items-center gap-2 text-fluid-sm font-medium text-ink-soft transition-colors hover:text-[#850B10] sm:flex-row-reverse sm:text-end"
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
