"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

export type FilterOption = { value: string; label: string; count?: number };

/** URL-param-driven segmented control. The `defaultValue` option is
 * represented by *removing* the param (clean URLs for the common case). */
export function FilterTabs({
  param,
  options,
  defaultValue,
}: {
  param: string;
  options: FilterOption[];
  defaultValue?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get(param) ?? defaultValue ?? options[0]?.value;

  function hrefFor(value: string) {
    const next = new URLSearchParams(searchParams);
    if (defaultValue !== undefined && value === defaultValue) next.delete(param);
    else next.set(param, value);
    const qs = next.toString();
    return qs ? `${pathname}?${qs}` : pathname;
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <Link
            key={opt.value}
            href={hrefFor(opt.value)}
            scroll={false}
            className={clsx(
              "font-kurdish inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-fluid-xs font-medium transition-colors",
              active
                ? "bg-ink text-canvas"
                : "border border-ink/15 text-ink-soft hover:border-pigment-terracotta hover:text-pigment-terracotta"
            )}
          >
            {opt.label}
            {opt.count !== undefined && opt.count > 0 && (
              <span
                className={clsx(
                  "rounded-full px-1.5 text-[10px] font-semibold",
                  active ? "bg-canvas/20 text-canvas" : "bg-ink/10 text-ink-soft"
                )}
              >
                {opt.count}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
