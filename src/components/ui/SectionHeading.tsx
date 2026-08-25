import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  heading?: string;
  subheading?: string;
  align?: "start" | "center";
  tone?: "dark" | "light";
  /** "compact" caps the heading/subheading size on mobile and tablet
   * (they still reach the same size as "default" on desktop) — for
   * sections where the fluid scale reads too large below lg:. */
  size?: "default" | "compact";
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "start",
  tone = "dark",
  size = "default",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center mx-auto" : "text-start";
  const inkClass = tone === "dark" ? "text-ink" : "text-canvas";
  const softClass = tone === "dark" ? "text-ink-soft" : "text-canvas/80";
  const headingSizeClass = size === "compact" ? "text-lg sm:text-xl lg:text-fluid-lg" : "text-fluid-lg";
  const subheadingSizeClass = size === "compact" ? "text-xs sm:text-sm lg:text-fluid-base" : "text-fluid-base";

  return (
    <div className={`flex max-w-2xl flex-col gap-3 ${alignClass}`}>
      {eyebrow && (
        <Reveal from="fade">
          <span
            className={`font-body text-fluid-xs uppercase tracking-[0.3em] ${
              tone === "dark" ? "" : "text-pigment-gold"
            }`}
            style={tone === "dark" ? { color: "#850B10" } : undefined}
          >
            {eyebrow}
          </span>
        </Reveal>
      )}
      {heading && (
        <Reveal delay={0.08}>
          <h2 className={`font-display ${headingSizeClass} font-semibold leading-[1.05] tracking-tight ${inkClass}`}>
            {heading}
          </h2>
        </Reveal>
      )}
      {subheading && (
        <Reveal delay={0.16}>
          <p className={`${subheadingSizeClass} leading-relaxed ${softClass}`}>{subheading}</p>
        </Reveal>
      )}
    </div>
  );
}
