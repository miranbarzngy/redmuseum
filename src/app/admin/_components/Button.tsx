import Link from "next/link";
import clsx from "clsx";

// The admin panel's button set, styled after native iOS / Android buttons:
//  - one accent colour for the main action (the museum's brand red), never
//    black-here-red-there — as a rubine-to-oxblood gradient with a lit top
//    edge and a soft red glow, so it reads as a raised, pressable surface;
//  - soft filled secondary buttons (gray / tinted) instead of thin outlines;
//  - 48px tall on phones (44px from `sm`), the native touch-target size;
//  - a quick press-down on tap (scale + a touch darker), no hover lift
//    (hover sticks after a tap on touch screens).
// Callers widen them with `w-full` / `flex-1` where a native screen would
// run the button edge to edge.
const btnBase =
  "font-kurdish inline-flex h-12 shrink-0 select-none items-center justify-center gap-2 whitespace-nowrap rounded-full px-5 text-fluid-sm font-medium transition-[background-color,color,box-shadow,transform,opacity,filter] duration-150 ease-out active:scale-[0.97] active:brightness-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 sm:h-11";

/** Filled brand red — the one main action on a screen. */
export const btnPrimary = clsx(btnBase, "bg-brand-fill text-white shadow-brand hover:brightness-110");

/** Gray fill — cancel, and everyday secondary actions. */
export const btnSecondary = clsx(btnBase, "bg-ink/[0.06] text-ink hover:bg-ink/10");

/** Brand-tinted fill — a secondary action that should still read as "go". */
export const btnTonal = clsx(btnBase, "bg-brand/10 text-brand hover:bg-brand/15");

/** Red-tinted fill — delete and other destructive actions. */
export const btnDanger = clsx(btnBase, "bg-pigment-crimson/10 text-pigment-crimson hover:bg-pigment-crimson/15");

/** Solid red — only for confirming a destructive action. */
export const btnDangerSolid = clsx(btnBase, "bg-pigment-crimson text-white hover:bg-pigment-crimson/90");

/** WhatsApp green. */
export const btnWhatsApp = clsx(btnBase, "bg-emerald-600 text-white hover:bg-emerald-700");

// Round icon-only buttons (edit / delete / reset on list rows and cards).
// Callers set the size, e.g. "h-11 w-11".
const iconBtnBase =
  "inline-flex shrink-0 select-none items-center justify-center rounded-full transition-[background-color,color,transform] duration-150 active:scale-90 disabled:cursor-not-allowed disabled:opacity-50";

export const iconBtn = clsx(iconBtnBase, "bg-ink/[0.05] text-ink-soft hover:bg-ink/10 hover:text-ink");

export const iconBtnDanger = clsx(
  iconBtnBase,
  "bg-pigment-crimson/[0.07] text-pigment-crimson hover:bg-pigment-crimson/15",
);

const LINK_VARIANT = { primary: btnPrimary, secondary: btnSecondary, tonal: btnTonal };

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & { variant?: keyof typeof LINK_VARIANT }) {
  return (
    <Link href={href} className={clsx(LINK_VARIANT[variant], className)} {...rest}>
      {children}
    </Link>
  );
}
