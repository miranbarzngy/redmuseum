"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, animate, useInView, useReducedMotion, type Variants } from "framer-motion";
import { Landmark, Archive, CalendarDays, Users, type LucideIcon } from "lucide-react";

// Matches PaintCanvas/ScrollPigmentBar/ExhibitionsTimeline's accent red.
const ACCENT = "#850B10";
const REST_SHADOW = "0 10px 30px -12px rgba(28,27,25,0.15)"; // tailwind.config.ts boxShadow.card
const HOVER_SHADOW = "0 22px 45px -15px rgba(133,11,16,0.4)";

const containerVariants: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.95, boxShadow: REST_SHADOW },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    boxShadow: REST_SHADOW,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

type Stat = { value: string; label: string };

// Eastern Arabic-Indic (٠-٩) and Extended/Persian (۰-۹) digit ranges — same
// conversion used elsewhere in this codebase (e.g. PasswordField.tsx).
function toWesternDigits(input: string): string {
  return input.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code <= 0x0669 ? 0x0660 : 0x06f0;
    return String(code - base);
  });
}

function toEasternDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => String.fromCharCode(0x0660 + Number(d)));
}

/**
 * Parses a free-typed stat value like "20,000", "٢٠,٠٠٠" or "+٥٠" into a
 * numeric count-up target plus a formatter that reproduces the style
 * (leading "+", thousands grouping) at any point during the animation, in
 * the active locale's digit system — Western for "en", Arabic-Indic for
 * ku/ar. Returns null for non-numeric admin input, which just renders as
 * static text instead of animating.
 */
function parseStat(
  raw: string,
  locale: string
): { target: number; format: (n: number) => string } | null {
  const trimmed = raw.trim();
  const prefix = trimmed.startsWith("+") ? "+" : "";
  const digitsOnly = toWesternDigits(trimmed.slice(prefix.length)).replace(/,/g, "");
  if (!digitsOnly || !/^\d+$/.test(digitsOnly)) return null;

  const target = Number(digitsOnly);
  const format = (n: number) => {
    const grouped = Math.round(n).toLocaleString("en-US");
    return prefix + (locale === "en" ? grouped : toEasternDigits(grouped));
  };
  return { target, format };
}

function AnimatedStatCard({
  icon: Icon,
  value,
  label,
  locale,
  index = 0,
}: {
  icon: LucideIcon;
  value: string;
  label: string;
  locale: string;
  index?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const reduceMotion = useReducedMotion();
  const parsed = useMemo(() => parseStat(value, locale), [value, locale]);
  const [display, setDisplay] = useState(() => (parsed ? parsed.format(0) : value));

  useEffect(() => {
    // The reduced-motion case is handled below as a derived render value
    // instead of a setState call here — same end state, without the
    // synchronous-setState-in-effect anti-pattern.
    if (!isInView || !parsed || reduceMotion) return;
    const controls = animate(0, parsed.target, {
      // Spring physics instead of a fixed-duration tween: the settle time
      // naturally scales with distance-to-target, so small counts like
      // "11" ease to rest instead of snapping, while large counts like
      // "20,000" decelerate smoothly instead of flickering through every
      // integer step at a constant rate.
      type: "spring",
      stiffness: 35,
      damping: 15,
      mass: 1,
      // Staggered per-card so all four counters don't fire in one burst.
      delay: index * 0.15,
      onUpdate: (v) => setDisplay(parsed.format(v)),
    });
    return () => controls.stop();
  }, [isInView, parsed, reduceMotion, index]);

  const shownValue = reduceMotion && isInView && parsed ? parsed.format(parsed.target) : display;

  return (
    <motion.div
      ref={ref}
      variants={itemVariants}
      whileHover={{ y: -8, boxShadow: HOVER_SHADOW }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
      className="flex w-full flex-col items-center gap-1.5 rounded-2xl border border-ink/10 bg-white/60 p-3 text-center backdrop-blur-md sm:w-40"
    >
      <span
        className="flex h-8 w-8 items-center justify-center rounded-lg"
        style={{ backgroundColor: ACCENT, color: "#FFFFFF" }}
      >
        <Icon size={15} />
      </span>
      <span className="font-display text-fluid-lg font-bold" style={{ color: ACCENT }}>
        {shownValue}
      </span>
      <span className="text-fluid-xs text-ink-soft">{label}</span>
    </motion.div>
  );
}

export function MuseumStatsPanel({
  stats,
  locale,
}: {
  stats: { museums: Stat; archive: Stat; activities: Stat; visitors: Stat };
  locale: string;
}) {
  const reduceMotion = useReducedMotion();

  return (
    // dir="ltr" is deliberate: without it, RTL flex order would swap which
    // stat pair renders on which physical side of the logo, the opposite of
    // "2 on the left / 2 on the right" regardless of locale.
    <motion.div
      dir="ltr"
      initial={reduceMotion ? undefined : "hidden"}
      whileInView={reduceMotion ? undefined : "visible"}
      viewport={{ once: true, amount: 0.15 }}
      variants={containerVariants}
      className="flex flex-col items-center gap-6 lg:flex-row lg:items-center lg:gap-8"
    >
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <AnimatedStatCard icon={Landmark} value={stats.museums.value} label={stats.museums.label} locale={locale} index={0} />
        <AnimatedStatCard icon={Archive} value={stats.archive.value} label={stats.archive.label} locale={locale} index={1} />
      </div>

      <motion.div variants={itemVariants} whileHover={{ y: -4 }} className="group relative">
        {/* Corner brackets — a museum-placard framing detail rather than a plain box. */}
        <span
          className="pointer-events-none absolute -left-2 -top-2 h-6 w-6 rounded-tl-md border-l-2 border-t-2"
          style={{ borderColor: ACCENT }}
        />
        <span
          className="pointer-events-none absolute -right-2 -top-2 h-6 w-6 rounded-tr-md border-r-2 border-t-2"
          style={{ borderColor: ACCENT }}
        />
        <span
          className="pointer-events-none absolute -bottom-2 -left-2 h-6 w-6 rounded-bl-md border-b-2 border-l-2"
          style={{ borderColor: ACCENT }}
        />
        <span
          className="pointer-events-none absolute -bottom-2 -right-2 h-6 w-6 rounded-br-md border-b-2 border-r-2"
          style={{ borderColor: ACCENT }}
        />

        <div className="relative overflow-hidden rounded-[2rem] border border-ink/10 bg-white/50 p-10 shadow-soft backdrop-blur-md transition-shadow duration-500 ease-out group-hover:shadow-[0_25px_50px_-20px_rgba(28,27,25,0.35)] sm:p-12">
          <Image
            src="/images/logo/1200x630png.png"
            alt="National Museum Amnasuraka"
            width={1200}
            height={630}
            className="relative h-auto w-56 transition-transform duration-500 ease-out group-hover:scale-105 sm:w-72"
          />
        </div>
      </motion.div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-1">
        <AnimatedStatCard icon={CalendarDays} value={stats.activities.value} label={stats.activities.label} locale={locale} index={2} />
        <AnimatedStatCard icon={Users} value={stats.visitors.value} label={stats.visitors.label} locale={locale} index={3} />
      </div>
    </motion.div>
  );
}
