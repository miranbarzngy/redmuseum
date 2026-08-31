import Link from "next/link";
import clsx from "clsx";

export const btnPrimary =
  "font-kurdish inline-flex items-center justify-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta disabled:cursor-not-allowed disabled:opacity-60";

export const btnSecondary =
  "font-kurdish inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta";

export function LinkButton({
  href,
  variant = "primary",
  className,
  children,
  ...rest
}: React.ComponentProps<typeof Link> & { variant?: "primary" | "secondary" }) {
  return (
    <Link
      href={href}
      className={clsx(variant === "primary" ? btnPrimary : btnSecondary, className)}
      {...rest}
    >
      {children}
    </Link>
  );
}
