import { Reveal } from "./Reveal";

interface SectionHeadingProps {
  eyebrow?: string;
  heading: string;
  subheading?: string;
  align?: "start" | "center";
  tone?: "dark" | "light";
}

export function SectionHeading({
  eyebrow,
  heading,
  subheading,
  align = "start",
  tone = "dark",
}: SectionHeadingProps) {
  const alignClass = align === "center" ? "text-center items-center mx-auto" : "text-start";
  const inkClass = tone === "dark" ? "text-ink" : "text-canvas";
  const softClass = tone === "dark" ? "text-ink-soft" : "text-canvas/80";

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
      <Reveal delay={0.08}>
        <h2 className={`font-display text-fluid-lg font-semibold leading-[1.05] tracking-tight ${inkClass}`}>
          {heading}
        </h2>
      </Reveal>
      {subheading && (
        <Reveal delay={0.16}>
          <p className={`text-fluid-base leading-relaxed ${softClass}`}>{subheading}</p>
        </Reveal>
      )}
    </div>
  );
}
