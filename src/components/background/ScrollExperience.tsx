"use client";

import { useScroll } from "framer-motion";
import { PaintCanvas } from "./PaintCanvas";
import { ScrollPigmentBar } from "./ScrollPigmentBar";

export function ScrollExperience({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();

  return (
    <>
      <PaintCanvas progress={scrollYProgress} />
      <ScrollPigmentBar progress={scrollYProgress} />
      <div className="relative">{children}</div>
    </>
  );
}
