import Link from "next/link";
import { Pencil } from "lucide-react";

/** The pencil-in-a-circle edit affordance repeated on every admin list row. */
export function EditLink({ href, label = "دەستکاریکردن" }: { href: string; label?: string }) {
  return (
    <Link
      href={href}
      aria-label={label}
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
    >
      <Pencil size={15} />
    </Link>
  );
}
