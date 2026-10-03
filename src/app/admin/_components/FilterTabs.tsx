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
              "font-kurdish inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 py-2 text-fluid-xs font-medium transition-[color,background-color,box-shadow,transform] duration-200 ease-spring active:scale-95",
              active
                ? "bg-brand-fill text-white shadow-brand"
                : "bg-white/80 text-ink-soft shadow-[0_1px_2px_rgba(28,27,25,0.05)] ring-1 ring-inset ring-ink/10 hover:bg-white hover:text-ink"
            )}
          >
            {opt.label}
            {opt.count !== undefined && opt.count > 0 && (
              <span
                className={clsx(
                  "rounded-full px-1.5 text-[10px] font-semibold tabular-nums",
                  active ? "bg-white/20 text-white" : "bg-ink/[0.07] text-ink-soft"
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
