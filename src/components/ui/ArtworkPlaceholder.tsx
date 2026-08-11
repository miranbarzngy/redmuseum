import { hashString, mulberry32 } from "@/lib/seededRandom";

const PALETTES: string[][] = [
  ["#C1652F", "#F4B183", "#1F5F5B"],
  ["#9B3B3B", "#C9A227", "#F4E4C1"],
  ["#1F5F5B", "#C9A227", "#EADFC8"],
  ["#C9A227", "#C1652F", "#3A2E2A"],
  ["#4A4642", "#9B3B3B", "#EADFC8"],
  ["#1C1B19", "#C1652F", "#C9A227"],
];

/**
 * Deterministic, seeded abstract "painting" used as a stand-in until real
 * artwork photography is dropped into /public/images. Same seed always
 * renders the same composition, so there's no SSR/client hydration drift.
 */
export function ArtworkPlaceholder({
  seed,
  className,
}: {
  seed: string;
  className?: string;
}) {
  const rand = mulberry32(hashString(seed));
  const palette = PALETTES[Math.floor(rand() * PALETTES.length)];
  const base = "#F4F1E9";

  const blobs = Array.from({ length: 5 }).map((_, i) => ({
    cx: 8 + rand() * 84,
    cy: 8 + rand() * 84,
    r: 16 + rand() * 26,
    color: palette[i % palette.length],
    opacity: 0.28 + rand() * 0.28,
  }));

  const strokes = Array.from({ length: 4 }).map((_, i) => {
    const y = 10 + rand() * 80;
    const sway = 8 + rand() * 22;
    return {
      d: `M -5 ${y.toFixed(1)} Q 50 ${(y - sway).toFixed(1)} 105 ${(y + sway / 2).toFixed(1)}`,
      color: palette[(i + 1) % palette.length],
      width: 4 + rand() * 9,
      opacity: 0.5 + rand() * 0.3,
    };
  });

  return (
    <svg
      viewBox="0 0 100 100"
      className={className}
      preserveAspectRatio="xMidYMid slice"
      role="img"
      aria-label="Artwork placeholder"
    >
      <rect width="100" height="100" fill={base} />
      {blobs.map((b, i) => (
        <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill={b.color} opacity={b.opacity} />
      ))}
      {strokes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          stroke={s.color}
          strokeWidth={s.width}
          strokeLinecap="round"
          fill="none"
          opacity={s.opacity}
        />
      ))}
      <rect width="100" height="100" fill="url(#grain)" opacity="0.05" />
      <defs>
        <pattern id="grain" width="4" height="4" patternUnits="userSpaceOnUse">
          <circle cx="1" cy="1" r="0.5" fill="#1C1B19" />
        </pattern>
      </defs>
    </svg>
  );
}
