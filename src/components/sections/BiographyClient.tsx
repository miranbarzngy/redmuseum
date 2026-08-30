"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Images } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArtworkPlaceholder } from "@/components/ui/ArtworkPlaceholder";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { BiographyBlockRow, BiographyIntroRow } from "@/lib/supabase/database.types";

function pickIntro(intro: BiographyIntroRow | null, field: "eyebrow" | "heading" | "intro", locale: Locale) {
  const value = intro?.[`${field}_${locale}`];
  return typeof value === "string" && value.trim() ? value : null;
}

function pickBody(block: BiographyBlockRow, locale: Locale) {
  return block[`body_${locale}`];
}

export function BiographyClient({
  intro,
  blocks,
}: {
  intro: BiographyIntroRow | null;
  blocks: BiographyBlockRow[];
}) {
  const t = useTranslations("biography");
  const locale = useLocale() as Locale;
  const fallbackParagraphs = t.raw("paragraphs") as string[];

  const eyebrow = pickIntro(intro, "eyebrow", locale) ?? t("eyebrow");
  const heading = pickIntro(intro, "heading", locale) ?? t("heading");
  const introText = pickIntro(intro, "intro", locale) ?? t("intro");

  return (
    <section id="biography" className="relative py-24 sm:py-32">
      <div className="container-art section-px flex flex-col gap-20">
        <SectionHeading eyebrow={eyebrow} heading={heading} subheading={introText} size="compact" />

        <div className="flex flex-col gap-16">
          {blocks.length > 0
            ? blocks.map((block, i) => (
                <Link
                  key={block.id}
                  href={`/museum/${block.id}`}
                  aria-label={t("viewDetails")}
                  className={`group flex flex-col items-center gap-8 rounded-3xl p-3 transition-colors hover:bg-white/40 lg:gap-14 lg:p-5 ${
                    i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                  }`}
                >
                  <Reveal from={i % 2 === 1 ? "end" : "start"} className="w-full lg:w-2/5">
                    {block.image_url ? (
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                        <Image
                          src={block.image_url}
                          alt=""
                          fill
                          sizes="(min-width: 1024px) 40vw, 90vw"
                          className="object-contain"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white p-2 shadow-card ring-1 ring-ink/5 transition-transform duration-500 ease-out group-hover:scale-[1.02]">
                        <div className="h-full w-full overflow-hidden rounded-xl">
                          <ArtworkPlaceholder seed={`bio-${block.id}`} className="h-full w-full" />
                        </div>
                      </div>
                    )}
                  </Reveal>
                  <Reveal delay={0.1} className="w-full lg:w-3/5">
                    <p className="text-xs sm:text-sm lg:text-fluid-base leading-relaxed text-ink-soft">{pickBody(block, locale)}</p>
                    <span className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
                      <span
                        className="inline-flex items-center gap-1.5 text-fluid-xs font-semibold uppercase tracking-[0.2em]"
                        style={{ color: "#850B10" }}
                      >
                        {t("viewDetails")}
                        <ArrowRight
                          size={14}
                          className="icon-flip transition-transform duration-300 group-hover:translate-x-1"
                        />
                      </span>
                      {(block.image_urls?.length ?? 0) > 1 && (
                        <span className="inline-flex items-center gap-1 text-fluid-xs text-ink-faint">
                          <Images size={13} />
                          {block.image_urls.length}
                        </span>
                      )}
                    </span>
                  </Reveal>
                </Link>
              ))
            : fallbackParagraphs.map((p, i) => (
                <div
                  key={i}
                  className={`flex flex-col items-center gap-8 lg:gap-14 ${
                    i % 2 === 1 ? "lg:flex-row-reverse" : "lg:flex-row"
                  }`}
                >
                  <Reveal from={i % 2 === 1 ? "end" : "start"} className="w-full lg:w-2/5">
                    <div className="aspect-[4/3] w-full overflow-hidden rounded-2xl bg-white p-2 shadow-card ring-1 ring-ink/5">
                      <div className="h-full w-full overflow-hidden rounded-xl">
                        <ArtworkPlaceholder seed={`bio-${i}`} className="h-full w-full" />
                      </div>
                    </div>
                  </Reveal>
                  <Reveal delay={0.1} className="w-full lg:w-3/5">
                    <p className="text-xs sm:text-sm lg:text-fluid-base leading-relaxed text-ink-soft">{p}</p>
                  </Reveal>
                </div>
              ))}
        </div>
      </div>
    </section>
  );
}
