"use client";

import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import type { PressCategory } from "@/data/press";
import type { Locale } from "@/i18n/routing";

/** Sentinel for "no category filter applied" — every real category is
 * identified by its own (database) id, so this just needs to be a value no
 * real category id will ever collide with. */
export const ALL_FILTER = "all";

/** "all" or a PressCategory.id */
export type MediaFilterValue = string;

export function MediaFilterTabs({
  categories,
  active,
  onChange,
}: {
  categories: PressCategory[];
  active: MediaFilterValue;
  onChange: (v: MediaFilterValue) => void;
}) {
  const t = useTranslations("media.filters");
  const locale = useLocale() as Locale;

  const tabs: { value: MediaFilterValue; label: string }[] = [
    { value: ALL_FILTER, label: t("all") },
    ...categories.map((c) => ({ value: c.id, label: c.label[locale] })),
  ];

  return (
    <div role="tablist" className="flex flex-wrap gap-2">
      {tabs.map((tab) => {
        const isActive = tab.value === active;
        return (
          <button
            key={tab.value}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.value)}
            className={`relative rounded-full px-5 py-2.5 text-fluid-sm font-medium transition-colors ${
              isActive ? "" : "border border-ink/15 hover:border-ink/30"
            }`}
          >
            {isActive && (
              <motion.span
                layoutId="media-filter-pill"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 300, damping: 28 }}
              />
            )}
            <span className={`relative z-10 ${isActive ? "text-canvas" : "text-ink-soft hover:text-ink"}`}>
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
