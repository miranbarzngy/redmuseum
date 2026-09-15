"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { proxiedImage } from "@/lib/proxiedImage";

// Same fixed bilingual wordmark as BrandLockup/Header — the logo doesn't
// switch language with the rest of the site.
const BRAND_NAME_KU = "مۆزەخانەی نیشتیمانی ئەمنە سورەکە";
const BRAND_NAME_EN = "National Museum Amnasuraka";

/**
 * Same right-to-left auto-scrolling strip as the homepage gallery
 * (GalleryClient's GalleryStrip) — a plain JS scrollLeft loop rather than a
 * CSS @keyframes transform, since a transform-based loop silently painted
 * nothing on at least one real device while scrollLeft's far more common
 * code path worked everywhere.
 */
export function MuseumPhotoMarquee({ photos }: { photos: string[] }) {
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);

  // Repeat the set until the strip is comfortably wider than any viewport,
  // then duplicate that for the seamless loop — with very few photos, two
  // copies alone wouldn't leave anything off-screen to scroll in.
  const repeats = Math.max(1, Math.ceil(10 / photos.length));
  const base = Array.from({ length: repeats }, () => photos).flat();
  const looped = [...base, ...base];

  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;

    let rafId: number;
    let lastTime: number | null = null;
    const pxPerSecond = 30;

    function step(time: number) {
      if (lastTime === null) lastTime = time;
      const dt = time - lastTime;
      lastTime = time;

      if (scroller && !pausedRef.current) {
        const singleSetWidth = scroller.scrollWidth / 2;
        const next = scroller.scrollLeft + (pxPerSecond * dt) / 1000;
        scroller.scrollLeft = next >= singleSetWidth ? next - singleSetWidth : next;
      }

      rafId = requestAnimationFrame(step);
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [photos.length]);

  return (
    <div
      ref={scrollerRef}
      style={{ direction: "ltr" }}
      className="overflow-x-hidden overflow-y-hidden"
      onMouseEnter={() => {
        pausedRef.current = true;
      }}
      onMouseLeave={() => {
        pausedRef.current = false;
      }}
    >
      <div className="flex w-max gap-4 px-6 sm:gap-6 sm:px-10">
        {looped.map((url, i) => (
          <div
            key={`${url}-${i}`}
            className="h-72 w-[26rem] shrink-0 bg-[#AAABAF] p-2 shadow-card ring-1 ring-black/5 sm:h-96 sm:w-[34rem] lg:h-[28rem] lg:w-[40rem]"
          >
            <div className="relative h-full w-full overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed-size scrolling strip, next/image's layout modes don't fit; proxiedImage() still routes through Next's image endpoint */}
              <img
                src={proxiedImage(url, 1920)}
                alt=""
                className="h-full w-full object-cover sepia-[.35] contrast-105 brightness-95 saturate-[.7]"
              />
              {/* Warm aged-paper cast + vignette */}
              <div
                className="pointer-events-none absolute inset-0 mix-blend-multiply"
                style={{
                  background:
                    "radial-gradient(ellipse at center, rgba(244,225,180,0.12) 0%, rgba(90,60,30,0.4) 100%)",
                }}
              />
              {/* Fine paper grain */}
              <div
                className="pointer-events-none absolute inset-0 opacity-[0.18] mix-blend-overlay"
                style={{
                  backgroundImage: "radial-gradient(rgba(255,255,255,0.7) 1px, transparent 1px)",
                  backgroundSize: "3px 3px",
                }}
              />
              <div className="absolute inset-x-0 bottom-3 flex flex-row items-center justify-center gap-2">
                <span className="flex flex-col items-end leading-tight drop-shadow-lg">
                  <span className="font-kurdish text-[11px] font-semibold text-white">
                    {BRAND_NAME_KU}
                  </span>
                  <span className="text-[9px] font-medium uppercase tracking-wider text-white/85">
                    {BRAND_NAME_EN}
                  </span>
                </span>
                <Image
                  src="/images/logo/logo.png"
                  alt=""
                  width={128}
                  height={128}
                  className="h-11 w-11 object-contain drop-shadow-lg"
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
