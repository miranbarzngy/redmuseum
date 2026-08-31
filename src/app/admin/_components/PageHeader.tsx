import Link from "next/link";
import { ArrowRight } from "lucide-react";

/**
 * The one header every admin page/edit page uses: optional back link (points
 * physically right — "back" in this permanently-RTL panel), title,
 * description, and an actions slot on the opposite edge.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "گەڕانەوە",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {backHref && (
        <Link
          href={backHref}
          className="font-kurdish inline-flex w-fit items-center gap-1.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:text-pigment-terracotta"
        >
          <ArrowRight size={15} /> {backLabel}
        </Link>
      )}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">{title}</h1>
          {description && (
            <p className="font-kurdish mt-1 text-fluid-sm text-ink-soft">{description}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
      </div>
    </div>
  );
}
