import Link from "next/link";
import clsx from "clsx";
import { Pencil } from "lucide-react";
import { iconBtn } from "./Button";

/** The pencil-in-a-circle edit affordance repeated on every admin list row.
 * `showLabel` prints the label underneath the circle — used on card grids
 * (gallery, sections, events) where there's room for it. */
export function EditLink({
  href,
  label = "دەستکاریکردن",
  showLabel,
}: {
  href: string;
  label?: string;
  showLabel?: boolean;
}) {
  return (
    <span className={clsx("inline-flex flex-col items-center", showLabel && "gap-1")}>
      <Link
        href={href}
        aria-label={label}
        className={clsx(iconBtn, "h-11 w-11")}
      >
        <Pencil size={18} />
      </Link>
      {showLabel && (
        <span className="whitespace-nowrap font-kurdish text-[11px] text-ink-soft">{label}</span>
      )}
    </span>
  );
}
