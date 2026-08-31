"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ChevronDown, Images } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { ArtworkPlaceholder } from "@/components/ui/ArtworkPlaceholder";
import { easeArt } from "@/lib/motionVariants";
import { pickSectionTitle } from "@/lib/museumSectionTitle";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { BiographyBlockRow, BiographyIntroRow } from "@/lib/supabase/database.types";

const ACCENT = "#850B10";

function pickIntro(intro: BiographyIntroRow | null, field: "eyebrow" | "heading" | "intro", locale: Locale) {
  const value = intro?.[`${field}_${locale}`];
  return typeof value === "string" && value.trim() ? value : null;
}

function pickBody(block: BiographyBlockRow, locale: Locale) {
  return block[`body_${locale}`];
}

/** First non-empty line of the localized body (falling back across
 * locales), trimmed to a single-line label for the sections list. */
function sectionExcerpt(block: BiographyBlockRow, locale: Locale): string {
  const raw =
    (block[`body_${locale}`] || "").trim() ||
    block.body_ku.trim() ||
    block.body_en.trim() ||
    block.body_ar.trim();
  const firstLine = raw.split("\n").map((line) => line.trim()).find(Boolean) ?? "";
  return firstLine.length > 70 ? `${firstLine.slice(0, 70).trimEnd()}…` : firstLine;
}

export function BiographyClient({
  intro,
  blocks,
}: {
  intro: BiographyIntroRow | null;
  blocks: BiographyBlockRow[];
}) {
  const t = useTranslations("biography");
  const tm = useTranslations("museum");
  const locale = useLocale() as Locale;
  const reduceMotion = useReducedMotion();
  const [showList, setShowList] = useState(false);
  const fallbackParagraphs = t.raw("paragraphs") as string[];

  const introText = pickIntro(intro, "intro", locale) ?? t("intro");

  const sectionsToggle =
    blocks.length > 0 ? (
      <button
        type="button"
        onClick={() => setShowList((open) => !open)}
        aria-expanded={showList}
        aria-controls="museum-sections-list"
        className="inline-flex items-center gap-2 rounded-full border px-4 py-2 text-fluid-sm font-semibold uppercase tracking-[0.15em] transition-colors hover:bg-white/50"
        style={{ borderColor: ACCENT, color: ACCENT }}
      >
        {t("sectionsToggle")}
        <span
          className="inline-flex h-5 min-w-[1.25rem] items-center justify-center rounded-full px-1 text-[0.7rem] tabular-nums"
          style={{ backgroundColor: "rgba(133, 11, 16, 0.12)" }}
        >
          {blocks.length}
        </span>
        <ChevronDown
          size={15}
          className={`transition-transform duration-300 ${showList ? "rotate-180" : ""}`}
        />
      </button>
    ) : null;

  return (
    <section id="biography" className="relative py-24 sm:py-32">
      <div className="container-art section-px flex flex-col gap-20">
        <div className="flex flex-col gap-5">
          <div className="flex max-w-2xl flex-col items-start gap-4">
            {sectionsToggle && <Reveal from="fade">{sectionsToggle}</Reveal>}
            <SectionHeading subheading={introText} size="compact" />
          </div>

          {blocks.length > 0 && (
            <AnimatePresence initial={false}>
              {showList && (
                <motion.div
                  id="museum-sections-list"
                  key="museum-sections-list"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: reduceMotion ? 0 : 0.3, ease: easeArt }}
                  className="max-w-2xl overflow-hidden"
                >
                  <ul className="mt-1 flex flex-col divide-y divide-ink/5 rounded-2xl bg-white/40 p-2 ring-1 ring-ink/5">
                    {blocks.map((block, i) => (
                      <li key={block.id}>
                        <Link
                          href={`/museum/${block.id}`}
                          className="group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-colors hover:bg-white/60"
                        >
                          <span
                            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-display text-fluid-xs font-bold text-white"
                            style={{ backgroundColor: ACCENT }}
                          >
                            {i + 1}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span
                              className="block truncate text-fluid-sm font-semibold"
                              style={{ color: ACCENT }}
                            >
                              {pickSectionTitle(block, locale) ||
                                tm("sectionLabel", { number: String(i + 1) })}
                            </span>
                            {sectionExcerpt(block, locale) && (
                              <span className="mt-0.5 line-clamp-1 text-fluid-xs text-ink-faint">
                                {sectionExcerpt(block, locale)}
                              </span>
                            )}
                          </span>
                          <ArrowRight
                            size={14}
                            className="icon-flip shrink-0 text-ink-faint transition-transform duration-300 group-hover:translate-x-1"
                          />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>

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
                      {(() => {
                        const extra = (block.image_urls ?? []).filter(
                          (url) => url && url !== block.image_url
                        ).length;
                        return extra > 0 ? (
                          <span className="inline-flex items-center gap-1 text-fluid-xs text-ink-faint">
                            <Images size={13} />
                            {extra + (block.image_url ? 1 : 0)}
                          </span>
                        ) : null;
                      })()}
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
