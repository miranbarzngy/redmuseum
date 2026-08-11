"use client";

import { useRef } from "react";
import { motion, useScroll, useReducedMotion } from "framer-motion";
import { Reveal } from "@/components/ui/Reveal";
import type { ExhibitionEntry } from "@/data/exhibitions";
import type { Locale } from "@/i18n/routing";

// Matches PaintCanvas/ScrollPigmentBar's accent red.
const ACCENT = "#850B10";

// Cancels the container's ps-10 so the dot wrapper's w-10 gutter lines up
// exactly with the track's w-10 gutter below — same width, same start edge,
// so flex justify-center puts the dot and the line on one shared center
// axis. (A tuned pixel offset here would drift again the moment the line
// width, dot size, or ps-10 value changes.)
const DOT_GUTTER_OFFSET = "-2.5rem";

/**
 * The vertical spine is two stacked layers: a faint permanent track, and a
 * crimson fill whose scaleY is driven by scroll progress through this exact
 * element (not the whole page) — same growing-bar technique as
 * ScrollPigmentBar, just scoped to this timeline instead of the full page.
 */
export function ExhibitionsTimeline({
  exhibitions,
  locale,
  emptyText,
}: {
  exhibitions: ExhibitionEntry[];
  locale: Locale;
  emptyText: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"],
  });

  if (exhibitions.length === 0) {
    return <p className="text-fluid-base text-ink-faint">{emptyText}</p>;
  }

  return (
    <div ref={containerRef} className="relative ms-3 w-full max-w-3xl ps-10">
      <div className="absolute inset-y-0 start-0 flex w-10 justify-center">
        <div className="h-full w-1 overflow-hidden rounded-full bg-ink/10">
          <motion.div
            className="h-full w-full origin-top rounded-full"
            style={{ backgroundColor: ACCENT, scaleY: reduceMotion ? 1 : scrollYProgress }}
          />
        </div>
      </div>

      {exhibitions.map((e, i) => (
        <Reveal key={e.id} delay={Math.min(i * 0.05, 0.3)} className="relative pb-12 last:pb-0">
          <div
            className="absolute top-1 flex w-10 justify-center overflow-visible"
            style={{ insetInlineStart: DOT_GUTTER_OFFSET }}
          >
            <span className="h-3.5 w-3.5 rounded-full ring-4 ring-canvas" style={{ backgroundColor: ACCENT }} />
          </div>
          <span className="font-display text-fluid-lg font-bold tracking-[0.05em]" style={{ color: ACCENT }}>
            {e.year}
          </span>
          <h4 className="mt-1 font-display text-fluid-lg font-semibold text-ink">{e.title[locale]}</h4>
          <p className="mt-2 max-w-xl text-fluid-sm leading-relaxed text-ink-soft">{e.description[locale]}</p>
        </Reveal>
      ))}
    </div>
  );
}
