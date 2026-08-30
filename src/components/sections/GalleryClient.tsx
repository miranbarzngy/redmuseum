"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import type { GalleryGroup } from "@/lib/data/gallery";
import type { Locale } from "@/i18n/routing";
import { proxiedImage } from "@/lib/proxiedImage";
import { GalleryLightbox } from "./GalleryLightbox";
import { GalleryDebugOverlay } from "./GalleryDebugOverlay";

function GalleryStrip({
  group,
  scrollDir,
  onOpen,
}: {
  group: GalleryGroup;
  scrollDir: "forward" | "backward";
  onOpen: (categoryId: string, idx: number) => void;
}) {
  const locale = useLocale() as Locale;
  const scrollerRef = useRef<HTMLDivElement>(null);
  const pausedRef = useRef(false);
  const { category, images } = group;
  // With very few source images, two copies barely fill the strip's width —
  // there's nothing left off-screen to scroll in, so the "loop" just looks
  // static. Repeat the set enough times first so the strip is comfortably
  // wider than any viewport, then duplicate that for the seamless loop.
  const repeats = Math.max(1, Math.ceil(10 / images.length));
  const base = Array.from({ length: repeats }, () => images).flat();
  const looped = [...base, ...base];

  // Plain JS-driven scrollLeft animation instead of a CSS @keyframes
  // transform — on at least one real device (Chrome/iOS) an animated
  // `transform` inside this overflow:hidden + forced-ltr strip loaded and
  // laid out every image correctly (confirmed via on-device diagnostics —
  // getBoundingClientRect and complete/naturalWidth all correct) but
  // painted nothing at all, a GPU-compositing paint bug rather than a
  // loading or layout one. Native scrollLeft goes through a completely
  // different, far more heavily-used browser code path.
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
        const delta = (pxPerSecond * dt) / 1000;
        let next = scroller.scrollLeft + (scrollDir === "forward" ? delta : -delta);
        if (next >= singleSetWidth) next -= singleSetWidth;
        if (next < 0) next += singleSetWidth;
        scroller.scrollLeft = next;
      }

      rafId = requestAnimationFrame(step);
    }

    // Start "backward" strips already offset into the loop so both
    // directions have somewhere to scroll from immediately, matching the
    // old CSS animation's two starting keyframes.
    if (scrollDir === "backward") {
      scroller.scrollLeft = scroller.scrollWidth / 2;
    }

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [scrollDir]);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="flex shrink-0 items-center gap-3 px-4 sm:px-8">
        <span className="text-xs font-medium uppercase tracking-[0.2em] text-ink">
          {category.label[locale]}
        </span>
        <span className="h-px flex-1 bg-ink/15" />
      </div>

      <div
        ref={scrollerRef}
        style={{ direction: "ltr" }}
        className="min-h-0 flex-1 overflow-x-hidden overflow-y-hidden"
        onMouseEnter={() => {
          pausedRef.current = true;
        }}
        onMouseLeave={() => {
          pausedRef.current = false;
        }}
      >
        <div className="flex h-full w-max gap-3 px-4 sm:px-8">
          {looped.map((img, i) => (
            <button
              key={`${img.id}-${i}`}
              type="button"
              onClick={() => onOpen(category.id, i % images.length)}
              className="group relative h-20 w-[142px] shrink-0 self-center overflow-hidden rounded-lg sm:h-24 sm:w-[171px] lg:h-32 lg:w-[227px]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- fixed-height scrolling strip, next/image's own layout modes don't fit a card this shape; proxiedImage() still routes the request through Next's image endpoint */}
              <img
                src={proxiedImage(img.imageUrl, 384)}
                alt={img.title ?? ""}
                className="h-full w-full object-cover"
              />
              <span className="pointer-events-none absolute inset-0 rounded-lg opacity-0 ring-2 ring-[#c8a96e] ring-inset transition-opacity duration-300 group-hover:opacity-60" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                <i className="ri-zoom-in-line text-2xl text-white" />
                {img.title && <span className="px-3 text-center text-xs text-white">{img.title}</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function GalleryClient({ groups }: { groups: GalleryGroup[] }) {
  const t = useTranslations("gallery");
  const [lightbox, setLightbox] = useState<{ categoryId: string; idx: number } | null>(null);

  const activeGroup = groups.find((g) => g.category.id === lightbox?.categoryId);

  return (
    <section id="media" className="relative flex flex-col overflow-hidden py-8">
      <div className="flex shrink-0 items-center justify-center gap-4 px-6 pb-6">
        <span className="h-px w-12 bg-[#c8a96e] sm:w-24" />
        <h2 className="font-display text-fluid-xl font-semibold text-ink">{t("heading")}</h2>
        <span className="h-px w-12 bg-[#c8a96e] sm:w-24" />
      </div>

      {groups.length === 0 ? (
        <p className="m-auto text-fluid-base text-ink-soft">{t("empty")}</p>
      ) : (
        <div className="flex min-h-0 flex-1 flex-col gap-4" style={{ height: "calc(100dvh - 12rem)" }}>
          {groups.map((group, i) => (
            <GalleryStrip
              key={group.category.id}
              group={group}
              scrollDir={i % 2 === 0 ? "forward" : "backward"}
              onOpen={(categoryId, idx) => setLightbox({ categoryId, idx })}
            />
          ))}
        </div>
      )}

      {lightbox && activeGroup && (
        <GalleryLightbox
          images={activeGroup.images}
          startIdx={lightbox.idx}
          onClose={() => setLightbox(null)}
        />
      )}

      <GalleryDebugOverlay />
    </section>
  );
}
