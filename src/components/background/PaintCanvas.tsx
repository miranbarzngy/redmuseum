"use client";

import { motion, MotionValue, useReducedMotion, useTransform } from "framer-motion";
import { useDirection } from "@/lib/useDirection";

interface PaintCanvasProps {
  progress: MotionValue<number>;
}

interface Ball {
  color: string;
  size: number;
  top: string;
  left: string;
  // How far the ball drifts (px) across the full scroll range — different
  // per ball so the layer reads as having depth rather than moving as one
  // flat sheet.
  parallax: number;
  // Looping travel path in viewport units (vw/vh), relative to its own
  // anchor position, so each ball genuinely sweeps a large stretch of the
  // screen instead of jittering in place. First and last points match so
  // the loop has no visible reset.
  floatX: string[];
  floatY: string[];
  duration: number;
  delay: number;
}

// Soft, faint washes in the site's pigment palette (see tailwind.config.ts)
// — a callback to the "paint" motif this layer is named after, now living
// as ambient shapes instead of drawn strokes. Kept low-opacity and heavily
// blurred on purpose: they should read as a slow-moving atmosphere, not as
// distinct colorful circles. Each one sweeps its own large, looping path
// at its own speed so the layer never reads as one flat sheet moving in
// lockstep.
const BALLS: Ball[] = [
  { color: "#C1652F", size: 420, top: "2%", left: "6%", parallax: -120, floatX: ["0vw", "55vw", "20vw", "0vw"], floatY: ["0vh", "35vh", "70vh", "0vh"], duration: 26, delay: 0 },
  { color: "#1F5F5B", size: 320, top: "56%", left: "84%", parallax: 90, floatX: ["0vw", "-60vw", "-25vw", "0vw"], floatY: ["0vh", "-40vh", "-65vh", "0vh"], duration: 22, delay: 2 },
  { color: "#C9A227", size: 280, top: "26%", left: "60%", parallax: -70, floatX: ["0vw", "-45vw", "35vw", "0vw"], floatY: ["0vh", "45vh", "-30vh", "0vh"], duration: 29, delay: 4 },
  { color: "#3D0000", size: 360, top: "76%", left: "16%", parallax: 100, floatX: ["0vw", "50vw", "15vw", "0vw"], floatY: ["0vh", "-50vh", "-20vh", "0vh"], duration: 24, delay: 1 },
  { color: "#9B3B3B", size: 240, top: "10%", left: "44%", parallax: -60, floatX: ["0vw", "-30vw", "40vw", "0vw"], floatY: ["0vh", "55vh", "20vh", "0vh"], duration: 27, delay: 3.5 },
];

function FloatingBall({ ball, progress }: { ball: Ball; progress: MotionValue<number> }) {
  // Parallax lives on this outer element (Framer Motion writes straight to
  // its transform each frame); the wandering loop lives on the inner
  // element below so the two never fight over the same `transform`.
  const y = useTransform(progress, [0, 1], [0, ball.parallax]);

  return (
    <motion.div className="absolute" style={{ top: ball.top, left: ball.left, y }}>
      <motion.div
        className="rounded-full blur-3xl"
        style={{
          width: ball.size,
          height: ball.size,
          backgroundColor: ball.color,
          opacity: 0.16,
        }}
        animate={{ x: ball.floatX, y: ball.floatY }}
        transition={{ duration: ball.duration, delay: ball.delay, repeat: Infinity, ease: "easeInOut" }}
      />
    </motion.div>
  );
}

/**
 * A fixed, full-viewport paint layer behind the whole page. Soft blurred
 * orbs in the site's pigment palette wander their own looping paths and
 * gently parallax at different speeds as the visitor scrolls, giving the
 * background a slow sense of depth without drawing attention away from the
 * foreground content.
 */
export function PaintCanvas({ progress }: PaintCanvasProps) {
  const reduceMotion = useReducedMotion();
  const dir = useDirection();

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
        {BALLS.map((ball, i) => (
          <FloatingBall key={i} ball={ball} progress={progress} />
        ))}
      </div>
    </div>
  );
}
