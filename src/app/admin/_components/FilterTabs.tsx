"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import clsx from "clsx";

export type FilterOption = { value: string; label: string; count?: number };

/** URL-param-driven segmented control. The `defaultValue` option is
 * represented by *removing* the param (clean URLs for the common case).
 * On phones the chips stay on one line and scroll sideways edge to edge,
 * like a native filter row, instead of wrapping into a tall block. */
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
    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto px-4 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {options.map((opt) => {
        const active = current === opt.value;
        return (
          <Link
            key={opt.value}
            href={hrefFor(opt.value)}
            scroll={false}
            className={clsx(
              "font-kurdish inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-fluid-xs font-medium transition-[colors,transform] duration-150 active:scale-95",
              active
                ? "bg-[#850B10] text-canvas"
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
