"use client";

import { useScroll } from "framer-motion";
import { PaintCanvas } from "./PaintCanvas";
import { ScrollPigmentBar } from "./ScrollPigmentBar";

export function ScrollExperience({
  children,
  showBrush = true,
}: {
  children: React.ReactNode;
  showBrush?: boolean;
}) {
  const { scrollYProgress } = useScroll();

  return (
    <>
      <PaintCanvas progress={scrollYProgress} showBrush={showBrush} />
      <ScrollPigmentBar progress={scrollYProgress} />
      <div className="relative">{children}</div>
    </>
  );
}
