"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useDirection } from "@/lib/useDirection";
import { easeArt } from "@/lib/motionVariants";

interface RevealProps {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  from?: "up" | "start" | "end" | "fade";
  amount?: number;
  once?: boolean;
}

export function Reveal({
  children,
  className,
  delay = 0,
  from = "up",
  amount = 0.25,
  once = true,
}: RevealProps) {
  const reduceMotion = useReducedMotion();
  const dir = useDirection();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  const offset = 36;
  const startX = dir === "rtl" ? offset : -offset;
  const endX = dir === "rtl" ? -offset : offset;

  const initial =
    from === "up"
      ? { opacity: 0, y: offset }
      : from === "start"
        ? { opacity: 0, x: startX }
        : from === "end"
          ? { opacity: 0, x: endX }
          : { opacity: 0 };

  return (
    <motion.div
      className={className}
      initial={initial}
      whileInView={{ opacity: 1, y: 0, x: 0 }}
      viewport={{ once, amount }}
      transition={{ duration: 0.85, delay, ease: easeArt }}
    >
      {children}
    </motion.div>
  );
}
