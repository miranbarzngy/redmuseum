import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: undefined,
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        canvas: {
          DEFAULT: "#FAFAF7",
          soft: "#F9F7F2",
          paper: "#F4F1E9",
        },
        ink: {
          DEFAULT: "#1C1B19",
          soft: "#4A4642",
          faint: "#8A8580",
        },
        pigment: {
          terracotta: "#C1652F",
          teal: "#1F5F5B",
          gold: "#C9A227",
          crimson: "#9B3B3B",
          // The museum logo's actual red — sampled from the dominant pixel
          // cluster in public/images/logo/logo.png (a red-duotone photo, so
          // individual pixels vary; #CC0C0C is the most frequent shade).
          // Distinct from `crimson`, which is used for error/danger states
          // and should stay muted rather than jump to full brand-red.
          red: "#CC0C0C",
          // Deep oxblood from the same logo's shadow pixels — dark enough to
          // hold white hero text legible at high opacity (same role `ink`
          // played before), but red-hued instead of neutral black.
          maroon: "#3D0000",
        },
      },
      fontFamily: {
        // Every var() below has an explicit fallback (the 2nd arg) — a bare
        // var() with no fallback that's ever undefined (e.g. --font-vazirmatn
        // outside the public [locale] layout tree, like on /admin) makes the
        // ENTIRE comma-separated font-family value invalid per the CSS spec,
        // not just that one entry — it doesn't skip to the next name in the
        // list, it discards the whole declaration and falls through to
        // inherited/default fonts. This is exactly what silently broke every
        // custom font on /admin.
        display: ["var(--font-vazirmatn, Vazirmatn)", "Vazirmatn", "sans-serif"],
        body: ["var(--font-vazirmatn, Vazirmatn)", "Vazirmatn", "sans-serif"],
        // No standalone "Kurdish Sarchia" entry after the var() — on the
        // public site (where --font-kurdish-local is undefined) the var()'s
        // own fallback argument already resolves to that exact face, so a
        // second standalone entry is never reached there. On /admin, where
        // --font-kurdish-local IS defined, that var() resolves to
        // "kurdishFont, kurdishFont Fallback" — kurdishFont excludes digits
        // (see admin/layout.tsx) and kurdishFont Fallback is `local(Arial)`,
        // which silently fails to match on Android (Arial isn't a system
        // font there, unlike Windows/macOS). A standalone "Kurdish Sarchia"
        // here used to be exactly what digits fell through to on Android
        // after that Arial lookup failed — and that face draws 0-9 as
        // Eastern Arabic-Indic glyphs. Dropping it lets digits cascade
        // straight to the sans-serif generic instead, which always resolves
        // to a real installed font (Roboto/Noto Sans on Android, Segoe UI on
        // Windows, etc.) with ordinary Western digit glyphs.
        kurdish: [
          "var(--font-kurdish-local, 'Kurdish Sarchia')",
          "var(--font-vazirmatn, Vazirmatn)",
          "Vazirmatn",
          "sans-serif",
        ],
      },
      fontSize: {
        "fluid-xs": "clamp(0.7rem, 0.66rem + 0.2vw, 0.8rem)",
        "fluid-sm": "clamp(0.8rem, 0.76rem + 0.2vw, 0.9rem)",
        "fluid-base": "clamp(0.95rem, 0.9rem + 0.25vw, 1.05rem)",
        "fluid-lg": "clamp(1rem, 0.95rem + 0.3vw, 1.15rem)",
        "fluid-xl": "clamp(1.2rem, 1.1rem + 0.5vw, 1.5rem)",
        "fluid-2xl": "clamp(1.5rem, 1.3rem + 1vw, 2.1rem)",
        "fluid-3xl": "clamp(2rem, 1.7rem + 1.5vw, 3rem)",
        "fluid-hero": "clamp(2.5rem, 1.85rem + 3.75vw, 5.9rem)",
        // Smaller than fluid-hero specifically so the (often long, localized)
        // museum name can fit on one line instead of wrapping to 3-4 lines.
        "fluid-name": "clamp(1.45rem, 1.1rem + 2.3vw, 3.6rem)",
      },
      letterSpacing: {
        tightest2: "-0.04em",
      },
      boxShadow: {
        soft: "0 20px 60px -20px rgba(28, 27, 25, 0.18)",
        card: "0 10px 30px -12px rgba(28, 27, 25, 0.15)",
        ring: "0 0 0 1px rgba(28, 27, 25, 0.06)",
      },
      backgroundImage: {
        "canvas-grain":
          "radial-gradient(circle at 20% 20%, rgba(193,101,47,0.05), transparent 40%), radial-gradient(circle at 80% 60%, rgba(31,95,91,0.05), transparent 45%)",
      },
      animation: {
        "float-slow": "float 9s ease-in-out infinite",
        "float-slower": "float 14s ease-in-out infinite",
        "drift": "drift 22s linear infinite",
        "pulse-soft": "pulse-soft 4s ease-in-out infinite",
        "glow-ring": "glowRing 1.9s ease-out infinite",
        "overlay-in": "overlayIn 0.2s ease-out",
        "modal-in": "modalIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "drawer-in": "drawerIn 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
        "drawer-in-left": "drawerInLeft 0.28s cubic-bezier(0.16, 1, 0.3, 1)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px) rotate(0deg)" },
          "50%": { transform: "translateY(-16px) rotate(2deg)" },
        },
        glowRing: {
          "0%": { boxShadow: "0 0 0 0 rgba(133,11,16,0.55)" },
          "70%": { boxShadow: "0 0 0 7px rgba(133,11,16,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(133,11,16,0)" },
        },
        drift: {
          "0%": { transform: "translateX(0) translateY(0)" },
          "50%": { transform: "translateX(2%) translateY(-2%)" },
          "100%": { transform: "translateX(0) translateY(0)" },
        },
        "pulse-soft": {
          "0%, 100%": { opacity: "0.5" },
          "50%": { opacity: "1" },
        },
        overlayIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        modalIn: {
          "0%": { opacity: "0", transform: "translateY(10px) scale(0.96)" },
          "100%": { opacity: "1", transform: "translateY(0) scale(1)" },
        },
        drawerIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
        drawerInLeft: {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      maxWidth: {
        "8xl": "90rem",
      },
    },
  },
  plugins: [],
};
export default config;
