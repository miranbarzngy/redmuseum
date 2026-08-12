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
      className="relative flex min-h-[70svh] items-center overflow-hidden pb-28 pt-28"
    >
      {/* Full-bleed background photo, matching the museum-building reference
          treatment — a framed thumbnail read too small/personal for a
          national museum's hero. */}
      <motion.div style={{ y: imageY }} className="absolute inset-0 -z-10">
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
                priority={heroImageIndex === 0}
                sizes="100vw"
                className="object-cover"
              />
            </motion.div>
          </AnimatePresence>
        ) : (
          <ArtworkPlaceholder seed="hero-masterpiece" className="h-full w-full" />
        )}
        {/* Dark red brand tint (was neutral ink/black) for text legibility —
            darker toward the bottom-left where the text block sits, lighter
            toward the top so the fixed header (rendered `solid` on this
            page) isn't reading against a wall of color. */}
        <div className="absolute inset-0 bg-gradient-to-t from-pigment-maroon/95 via-pigment-maroon/80 to-pigment-maroon/45" />
      </motion.div>

      <div className="container-art section-px relative w-full">
        <motion.div style={{ opacity: contentOpacity }} className="flex flex-col gap-6">
          <Reveal from="fade">
            <span className="inline-block rounded-full bg-pigment-red px-2 py-0.5 text-[7px] font-medium uppercase tracking-[0.08em] text-canvas sm:px-3 sm:py-1 sm:text-[10px] sm:tracking-[0.15em] lg:px-4 lg:py-1.5 lg:text-xs lg:tracking-[0.2em]">
              {eyebrow}
            </span>
          </Reveal>

          {/* Word-by-word stagger instead of the shared Reveal wrapper — the
              museum name is the one line on the page that should feel like
              an entrance, not just another fade-up block. whitespace-nowrap
              only kicks in from sm: up so it can still wrap on narrow phones
              instead of overflowing. */}
          <motion.h1
            className="font-display text-lg font-semibold leading-[1.05] tracking-tightest2 text-canvas sm:text-xl sm:whitespace-nowrap lg:text-2xl"
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

          <div className="flex max-w-xl flex-col gap-6">
            <Reveal delay={0.2}>
              <p className="max-w-md whitespace-pre-line text-[9px] leading-relaxed text-canvas/85 sm:text-[11px] lg:text-sm">
                {statement}
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
        className="absolute inset-x-0 bottom-24 z-10 mx-auto hidden w-fit flex-col items-center gap-2 text-canvas/80 transition-colors hover:text-pigment-gold sm:bottom-32 lg:flex"
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
