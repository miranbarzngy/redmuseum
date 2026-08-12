"use client";

import { motion, MotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useDirection } from "@/lib/useDirection";

interface PaintCanvasProps {
  progress: MotionValue<number>;
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
export function PaintCanvas({ progress }: PaintCanvasProps) {
  const reduceMotion = useReducedMotion();
  const dir = useDirection();

  // Solid grey, matching the header nav's text color (#2E2F33) — replaces
  // the brand-red strokes these used to draw in.
  const STROKE_COLOR = "#2E2F33";

  // Hero — a single, gentle arc.
  const heroPath = useTransform(progress, [0, 0.06, 0.16, 0.22], [0, 1, 1, 0]);
  const heroOpacity = useTransform(progress, [0, 0.04, 0.18, 0.24], [0, 0.05, 0.05, 0]);
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
  const deptOpacity = useTransform(progress, [0.2, 0.26, 0.44, 0.52], [0, 0.05, 0.05, 0]);
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
  const mediaOpacity = useTransform(progress, [0.46, 0.52, 0.72, 0.8], [0, 0.05, 0.05, 0]);
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
  const contactOpacity = useTransform(progress, [0.74, 0.8, 1], [0, 0.05, 0.05]);
  const contactD = useTransform(
    progress,
    [0.74, 0.82, 1],
    [
      "M -50 750 C 300 720, 700 800, 1050 760",
      "M -50 800 C 320 760, 680 820, 1050 720",
      "M -50 800 C 320 760, 680 820, 1050 720",
    ]
  );

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
            stroke={STROKE_COLOR}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ d: heroD, pathLength: heroPath, opacity: heroOpacity }}
          />
          <motion.path
            stroke={STROKE_COLOR}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ d: deptD, pathLength: deptPath, opacity: deptOpacity }}
          />
          <motion.path
            stroke={STROKE_COLOR}
            strokeWidth="4"
            strokeLinecap="round"
            style={{ d: mediaD, pathLength: mediaPath, opacity: mediaOpacity }}
          />
          <motion.path
            stroke={STROKE_COLOR}
            strokeWidth="3"
            strokeLinecap="round"
            style={{ d: contactD, pathLength: contactPath, opacity: contactOpacity }}
          />
        </svg>
      </div>
    </div>
  );
}
