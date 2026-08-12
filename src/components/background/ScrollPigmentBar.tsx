"use client";

import { motion, MotionValue, useReducedMotion } from "framer-motion";

interface ScrollPigmentBarProps {
  progress: MotionValue<number>;
}

export function ScrollPigmentBar({ progress }: ScrollPigmentBarProps) {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed end-4 top-1/2 z-40 hidden h-48 w-1.5 overflow-hidden rounded-full bg-canvas-paper shadow-ring will-change-transform sm:block lg:end-8"
      style={{ transform: "translateY(-50%) translateZ(0)" }}
    >
      <motion.div
        style={{ scaleY: progress, backgroundColor: "#850B10" }}
        className="h-full w-full origin-top rounded-full"
      />
    </div>
  );
}
