"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDown } from "lucide-react";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { ArtworkPlaceholder } from "@/components/ui/ArtworkPlaceholder";
import { scrollToId } from "@/lib/scrollTo";
import { useRouter } from "@/i18n/navigation";
import { easeArt } from "@/lib/motionVariants";
import type { SiteProfileRow } from "@/lib/supabase/database.types";
import type { Locale } from "@/i18n/routing";

function pick(profile: SiteProfileRow | null, field: "eyebrow" | "name" | "statement", locale: Locale) {
  const value = profile?.[`${field}_${locale}`];
  return typeof value === "string" && value.trim() ? value : null;
}

export function HeroClient({ profile }: { profile: SiteProfileRow | null }) {
  const t = useTranslations("hero");
  const locale = useLocale() as Locale;
  const router = useRouter();
  const ref = useRef<HTMLElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imageY = useTransform(scrollYProgress, [0, 1], ["0%", reduceMotion ? "0%" : "12%"]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.7], [1, 0]);

  const eyebrow = pick(profile, "eyebrow", locale) ?? t("eyebrow");
  const name = pick(profile, "name", locale) ?? t("name");
  const statement = pick(profile, "statement", locale) ?? t("statement");
  // Each locale's statement can optionally end with a "blank" for a rotating
  // historical term (e.g. ku's shipped statement ends at "...مێژووی", with
  // the rotator supplying the term plus its suffix). en/ar ship with empty
  // word lists, so by default they render as plain, complete sentences —
  // the admin opts a locale into the rotator by filling in its word list
  // (site_profile.statement_words_{locale}) and, if needed, rewriting that
  // locale's statement to end at the matching blank.
  const localizedWords: Record<Locale, string[] | null | undefined> = {
    ku: profile?.statement_words_ku,
    en: profile?.statement_words_en,
    ar: profile?.statement_words_ar,
  };
  const localizedSuffix: Record<Locale, string | null | undefined> = {
    ku: profile?.statement_suffix_ku,
    en: profile?.statement_suffix_en,
    ar: profile?.statement_suffix_ar,
  };
  const savedWords = localizedWords[locale];
  const dynamicWords =
    savedWords && savedWords.length > 0
      ? savedWords
      : ((t.raw("statementWords") as string[] | undefined) ?? []);
  // Nullish, not `||` — an explicitly-cleared suffix (saved as "") should stay
  // blank instead of reverting to the shipped default every time.
  const dynamicSuffix = localizedSuffix[locale] ?? t("statementSuffix");
  const [dynamicWordIndex, setDynamicWordIndex] = useState(0);

  useEffect(() => {
    if (reduceMotion || dynamicWords.length < 2) return;
    const id = setInterval(() => {
      setDynamicWordIndex((i) => (i + 1) % dynamicWords.length);
    }, 6000);
    return () => clearInterval(id);
  }, [reduceMotion, dynamicWords.length]);

  const heroImages =
    profile?.hero_image_urls && profile.hero_image_urls.length > 0
      ? profile.hero_image_urls
      : profile?.hero_image_url
        ? [profile.hero_image_url]
        : [];
  const [heroImageIndex, setHeroImageIndex] = useState(0);
  const nameWords = name.split(" ");

  useEffect(() => {
    if (heroImages.length < 2) return;
    const id = setInterval(() => {
      setHeroImageIndex((i) => (i + 1) % heroImages.length);
    }, 6000);
    return () => clearInterval(id);
  }, [heroImages.length]);

  return (
    <section
      id="hero"
      ref={ref}
      // Top padding = the fixed header's height (h-20, plus the hours bar
      // on sm+), so the photo starts below the header instead of behind it.
      className="relative overflow-hidden bg-pigment-maroon pt-20 sm:pt-[108px]"
    >
      {/* Photo and text share one grid cell, so the hero is as tall as
          whichever is taller. The photo box is always full width at 16:9
          (the ratio the admin upload asks for), so the whole photo shows —
          except on desktop (lg+), where a full 16:9 ran taller than the
          screen, so the box is 20:7 and trims some off the top/bottom.
          On narrow phones the text is taller than the photo and runs on
          onto the plain dark red below. */}
      <div className="grid">
        {/* Full-bleed photo, matching the museum-building reference
            treatment — a framed thumbnail read too small/personal for a
            national museum's hero. */}
        <motion.div
          style={{ y: imageY }}
          className="relative col-start-1 row-start-1 aspect-video w-full self-start lg:aspect-[20/7]"
        >
          {heroImages.length > 0 ? (
            <AnimatePresence initial={false}>
              <motion.div
                key={heroImages[heroImageIndex]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.2, ease: easeArt }}
                className="absolute inset-0"
              >
                <Image
                  src={heroImages[heroImageIndex]}
                  alt=""
                  fill
                  preload={heroImageIndex === 0}
                  sizes="100vw"
                  className="object-cover"
                />
              </motion.div>
            </AnimatePresence>
          ) : (
            <ArtworkPlaceholder seed="hero-masterpiece" className="h-full w-full" />
          )}
          {/* Dark red brand tint (was neutral ink/black) for text legibility —
              darker toward the bottom where it meets the section's own dark
              red, lighter toward the top so the photo still reads under the
              header. */}
          <div className="absolute inset-0 bg-gradient-to-t from-pigment-maroon/95 via-pigment-maroon/80 to-pigment-maroon/45" />
        </motion.div>

        <div className="container-art section-px relative col-start-1 row-start-1 w-full self-center pb-20 pt-8 sm:pb-28">
          <motion.div style={{ opacity: contentOpacity }} className="flex flex-col gap-6">
            <Reveal from="fade">
              <span className="inline-block rounded-full bg-pigment-red px-2 py-0.5 text-[7px] font-medium uppercase tracking-[0.08em] text-canvas sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.15em] lg:px-4 lg:py-1.5 lg:text-xs lg:tracking-[0.2em]">
                {eyebrow}
              </span>
            </Reveal>
  
            {/* Word-by-word stagger instead of the shared Reveal wrapper — the
                museum name is the one line on the page that should feel like
                an entrance, not just another fade-up block. Left to wrap
                normally (no forced nowrap) so longer admin-edited/translated
                names don't overflow the viewport. */}
            <motion.h1
              className="font-display text-lg font-semibold leading-[1.05] tracking-tightest2 text-canvas sm:text-xl lg:text-2xl"
              initial={reduceMotion ? undefined : "hidden"}
              whileInView={reduceMotion ? undefined : "visible"}
              viewport={{ once: true, amount: 0.6 }}
            >
              {nameWords.map((word, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  variants={{
                    hidden: { opacity: 0, y: 28 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      transition: { duration: 0.65, delay: 0.15 + i * 0.1, ease: easeArt },
                    },
                  }}
                >
                  {word}
                  {i < nameWords.length - 1 ? " " : ""}
                </motion.span>
              ))}
            </motion.h1>
  
            <div className="flex flex-col gap-6">
              <Reveal delay={0.2}>
                {/* Below sm the size scales with the screen: the text width
                    (100vw minus section-px's 2×1.5rem) split into 25em, so
                    the shipped statement plus its longest rotating word
                    (~23.6em in the Kurdish face) stays on one line on
                    phones. Capped at the old text-lg so it never grows. */}
                <p className="whitespace-pre-line text-[length:min(1.125rem,calc((100vw_-_3rem)/25))] leading-relaxed text-gray-200 sm:text-xl lg:text-2xl">
                  {statement}
                  {dynamicWords.length > 1 && (
                    <>
                      {" "}
                      <span className="relative inline-grid align-baseline">
                        <AnimatePresence mode="wait">
                          <motion.span
                            key={dynamicWords[dynamicWordIndex]}
                            initial={reduceMotion ? undefined : { opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={reduceMotion ? undefined : { opacity: 0, y: -10 }}
                            transition={{ duration: reduceMotion ? 0 : 1, ease: easeArt }}
                            className="col-start-1 row-start-1 font-semibold text-pigment-gold [text-shadow:0_0_18px_rgba(201,162,39,0.5)]"
                          >
                            {dynamicWords[dynamicWordIndex]}
                          </motion.span>
                        </AnimatePresence>
                      </span>{" "}
                      {dynamicSuffix}
                    </>
                  )}
                </p>
              </Reveal>
              <Reveal delay={0.3}>
                <div className="flex items-center gap-4 pt-2">
                  <Button
                    variant="inverse"
                    onClick={() => router.push("/booking")}
                    className="!px-2.5 !py-1.5 !text-[9px] sm:!px-4 sm:!py-2 sm:!text-[11px] lg:!px-5 lg:!py-2.5 lg:!text-xs"
                  >
                    {t("cta")}
                  </Button>
                </div>
              </Reveal>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Wave frame at the hero/page seam. */}
      <svg
        className="pointer-events-none absolute inset-x-0 -bottom-px h-16 w-full text-canvas sm:h-24"
        viewBox="0 0 1440 100"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <path
          fill="currentColor"
          d="M0,40 C240,90 480,0 720,30 C960,60 1200,100 1440,50 L1440,100 L0,100 Z"
        />
      </svg>
      <div className="pointer-events-none absolute inset-x-0 -bottom-px h-16 w-full bg-canvas-grain sm:h-24" />

      <motion.button
        onClick={() => scrollToId("biography")}
        className="absolute inset-x-0 bottom-24 z-10 mx-auto hidden w-fit flex-col items-center gap-2 text-gray-300 transition-colors hover:text-pigment-gold sm:bottom-32 lg:flex"
        animate={reduceMotion ? undefined : { y: [0, 8, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        aria-label={t("scrollHint")}
      >
        <span className="text-fluid-xs uppercase tracking-[0.25em]">{t("scrollHint")}</span>
        <ArrowDown size={18} />
      </motion.button>
    </section>
  );
}
