import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, ExternalLink, FileText, Mic, BookOpen, Newspaper } from "lucide-react";
import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
import { Reveal } from "@/components/ui/Reveal";
import { ArtworkPlaceholder } from "@/components/ui/ArtworkPlaceholder";
import { Link } from "@/i18n/navigation";
import { getPressItem } from "@/lib/data/press";
import { formatPressDate } from "@/lib/formatDate";
import type { Locale } from "@/i18n/routing";

// Keyed by the original three seeded category slugs — any category the
// admin adds beyond those falls back to a generic icon rather than crashing.
const ICONS: Record<string, typeof Newspaper> = {
  interview: Mic,
  article: FileText,
  publication: BookOpen,
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { locale, id } = await params;
  const item = await getPressItem(id);
  if (!item) return {};

  const title = item.title[locale as Locale];
  return {
    title,
    description: item.excerpt[locale as Locale] || title,
  };
}

export default async function MediaDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("media");
  const item = await getPressItem(id);

  if (!item) notFound();

  const loc = locale as Locale;
  const Icon = ICONS[item.category.slug] ?? Newspaper;

  return (
    <>
      <HeaderServer />
      <ScrollExperience>
        <main>
          <article className="pb-24 pt-36 sm:pb-32 sm:pt-40">
            <div className="container-art section-px flex flex-col gap-10">
              <Reveal from="fade">
                <Link
                  href="/media"
                  className="inline-flex w-fit items-center gap-2 text-fluid-sm font-medium text-ink-soft transition-colors hover:text-pigment-terracotta"
                >
                  <ArrowLeft size={16} className="icon-flip" />
                  {t("backToMedia")}
                </Link>
              </Reveal>

              <div className="grid gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:items-start lg:gap-16">
                <Reveal from="start">
                  <div className="relative aspect-[4/3] w-full overflow-hidden rounded-[1.75rem] bg-white p-3 shadow-soft ring-1 ring-ink/5 sm:aspect-[16/11]">
                    <div className="relative h-full w-full overflow-hidden rounded-[1.25rem]">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.title[loc]}
                          fill
                          priority
                          sizes="(min-width: 1024px) 55vw, 100vw"
                          className="object-cover"
                        />
                      ) : (
                        <ArtworkPlaceholder seed={item.id} className="h-full w-full" />
                      )}
                    </div>
                  </div>
                </Reveal>

                <Reveal from="end" delay={0.1} className="flex flex-col gap-6">
                  <span className="flex items-center gap-2 text-fluid-xs font-medium uppercase tracking-[0.25em] text-pigment-teal">
                    <Icon size={14} /> {item.outlet}
                  </span>

                  <h1 className="font-display text-fluid-3xl font-semibold leading-tight text-ink">
                    {item.title[loc]}
                  </h1>

                  <span className="text-fluid-sm text-ink-faint">
                    {formatPressDate(item.date, loc)}
                  </span>

                  {item.excerpt[loc] && (
                    <p className="text-fluid-base leading-relaxed text-ink-soft">{item.excerpt[loc]}</p>
                  )}

                  <a
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="mt-2 inline-flex w-fit items-center gap-2 rounded-full bg-ink px-7 py-3.5 text-fluid-sm font-medium tracking-wide text-canvas transition-colors duration-300 hover:bg-pigment-terracotta"
                  >
                    {t("viewSource")}
                    <ExternalLink size={15} className="icon-flip" />
                  </a>
                </Reveal>
              </div>
            </div>
          </article>
        </main>
        <Footer />
      </ScrollExperience>
    </>
  );
}
