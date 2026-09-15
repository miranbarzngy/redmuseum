"use client";

import { useScroll } from "framer-motion";
import { PaintCanvas } from "./PaintCanvas";

export function ScrollExperience({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();

  return (
    <>
      <PaintCanvas progress={scrollYProgress} />
      <div className="relative">{children}</div>
    </>
  );
}
