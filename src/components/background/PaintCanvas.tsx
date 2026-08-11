"use client";

import Image from "next/image";
import { motion, MotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useDirection } from "@/lib/useDirection";

interface PaintCanvasProps {
  progress: MotionValue<number>;
  /** The floating palette+brush glyph tracks scroll position across the
   * whole page — on standalone pages that don't share the homepage's
   * scroll narrative (e.g. the media detail pages), it reads as a stray,
   * out-of-place element rather than part of a story. Default on. */
  showBrush?: boolean;
}

/**
 * A fixed, full-viewport paint layer that reacts to global scroll progress.
 * Each stroke draws itself in as the visitor scrolls through the matching
 * section, morphing its own curvature as it goes (not just fading in a
 * static shape) before receding as the next one takes over — a quiet
 * narrative thread connecting Hero -> Departments -> Media -> Contact.
 * Four strokes for four sections (there is no standalone Gallery section
 * anymore), each a visibly different curve family so the strokes read as
 * distinct brushmarks rather than four copies of the same S-curve.
 */
export function PaintCanvas({ progress, showBrush = true }: PaintCanvasProps) {
  const reduceMotion = useReducedMotion();
  const dir = useDirection();

  // Hero — a single, gentle arc.
  const heroPath = useTransform(progress, [0, 0.06, 0.16, 0.22], [0, 1, 1, 0]);
  const heroOpacity = useTransform(progress, [0, 0.04, 0.18, 0.24], [0, 0.85, 0.85, 0]);
  const heroD = useTransform(
    progress,
    [0, 0.06, 0.16, 0.22],
    [
      "M -50 170 C 220 60, 420 270, 1050 110",
      "M -50 140 C 260 220, 440 40, 1050 160",
      "M -50 140 C 260 220, 440 40, 1050 160",
      "M -50 170 C 220 60, 420 270, 1050 110",
    ]
  );

  // Departments (formerly Biography) — a double wave, structurally distinct
  // from the single-arc strokes elsewhere on the page.
  const deptPath = useTransform(progress, [0.2, 0.28, 0.42, 0.5], [0, 1, 1, 0]);
  const deptOpacity = useTransform(progress, [0.2, 0.26, 0.44, 0.52], [0, 0.85, 0.85, 0]);
  const deptD = useTransform(
    progress,
    [0.2, 0.28, 0.42, 0.5],
    [
      "M -50 300 C 150 380, 350 220, 550 300 C 750 380, 950 220, 1050 280",
      "M -50 260 C 180 200, 330 400, 550 300 C 770 200, 920 400, 1050 320",
      "M -50 260 C 180 200, 330 400, 550 300 C 770 200, 920 400, 1050 320",
      "M -50 300 C 150 380, 350 220, 550 300 C 750 380, 950 220, 1050 280",
    ]
  );

  // Media — a steep diagonal sweep.
  const mediaPath = useTransform(progress, [0.46, 0.54, 0.7, 0.78], [0, 1, 1, 0]);
  const mediaOpacity = useTransform(progress, [0.46, 0.52, 0.72, 0.8], [0, 0.85, 0.85, 0]);
  const mediaD = useTransform(
    progress,
    [0.46, 0.54, 0.7, 0.78],
    [
      "M 1050 500 C 700 650, 300 350, -50 550",
      "M 1050 560 C 680 380, 320 680, -50 480",
      "M 1050 560 C 680 380, 320 680, -50 480",
      "M 1050 500 C 700 650, 300 350, -50 550",
    ]
  );

  // Contact — a low, minimal diagonal (deliberately the calmest shape, last
  // brushstroke in the sequence). Stays drawn once complete rather than
  // fading, since there's no section after it.
  const contactPath = useTransform(progress, [0.74, 0.82, 1], [0, 1, 1]);
  const contactOpacity = useTransform(progress, [0.74, 0.8, 1], [0, 0.85, 0.85]);
  const contactD = useTransform(
    progress,
    [0.74, 0.82, 1],
    [
      "M -50 750 C 300 720, 700 800, 1050 760",
      "M -50 800 C 320 760, 680 820, 1050 720",
      "M -50 800 C 320 760, 680 820, 1050 720",
    ]
  );

  const splatterScale = useTransform(progress, [0.18, 0.24, 0.42, 0.5], [0, 1, 1, 0.7]);
  const splatterScale2 = useTransform(progress, [0.44, 0.5, 0.7, 0.78], [0, 1, 1, 0.7]);

  // Fixed in place rather than tracking scroll — a static resting pose
  // instead of the drift-around-the-page path this used to follow.
  const brushX = "10%";
  const brushY = "14%";
  const brushRotate = -10;

  if (reduceMotion) {
    return (
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-canvas">
        <div className="absolute inset-0 bg-canvas-grain opacity-60" />
      </div>
    );
  }

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-canvas will-change-transform"
      style={{
        transform: "translateZ(0)",
        WebkitBackfaceVisibility: "hidden",
        backfaceVisibility: "hidden",
      }}
    >
      <div className="absolute inset-0 bg-canvas-grain" />

      <div
        className="absolute inset-0"
        style={{ transform: dir === "rtl" ? "scaleX(-1) translateZ(0)" : "translateZ(0)" }}
      >
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 1000"
          preserveAspectRatio="xMidYMid slice"
          fill="none"
        >
          <motion.path
            stroke="#850B10"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ d: heroD, pathLength: heroPath, opacity: heroOpacity }}
          />
          <motion.path
            stroke="#850B10"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ d: deptD, pathLength: deptPath, opacity: deptOpacity }}
          />
          <motion.path
            stroke="#850B10"
            strokeWidth="4"
            strokeLinecap="round"
            style={{ d: mediaD, pathLength: mediaPath, opacity: mediaOpacity }}
          />
          <motion.path
            stroke="#850B10"
            strokeWidth="3"
            strokeLinecap="round"
            style={{ d: contactD, pathLength: contactPath, opacity: contactOpacity }}
          />
        </svg>

        {/* paint splash, top-left */}
        <motion.div
          style={{ scale: splatterScale }}
          className="absolute left-[10%] top-[20%] h-24 w-24 origin-center sm:h-32 sm:w-32"
        >
          <Image
            src="/images/backgroundanimationicon/3.png"
            alt=""
            fill
            sizes="128px"
            className="object-contain opacity-25"
          />
        </motion.div>

        {/* paint splash, bottom-right (mirrored for variety) */}
        <motion.div
          style={{ scale: splatterScale2, scaleX: -1 }}
          className="absolute right-[8%] top-[64%] h-24 w-24 origin-center sm:h-32 sm:w-32"
        >
          <Image
            src="/images/backgroundanimationicon/3.png"
            alt=""
            fill
            sizes="128px"
            className="object-contain opacity-25"
          />
        </motion.div>

        {showBrush && (
          <motion.div
            style={{ left: brushX, top: brushY, rotate: brushRotate, x: "-50%", y: "-50%", z: 0 }}
            className="absolute h-10 w-10 will-change-transform sm:h-20 sm:w-20"
          >
            <motion.div
              className="relative h-full w-full opacity-80"
              animate={{ scale: [1, 1.05, 0.98, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Image
                src="/images/backgroundanimationicon/1.png"
                alt=""
                fill
                sizes="80px"
                className="object-contain drop-shadow-sm"
              />
            </motion.div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
