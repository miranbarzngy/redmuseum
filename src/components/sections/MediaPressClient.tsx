"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Link } from "@/i18n/navigation";
import { ALL_FILTER, MediaFilterTabs, type MediaFilterValue } from "./MediaFilterTabs";
import { PressCard } from "./PressCard";
import type { PressCategory, PressItem } from "@/data/press";

export function MediaPressClient({
  items,
  categories,
  limit,
}: {
  items: PressItem[];
  categories: PressCategory[];
  limit?: number;
}) {
  const t = useTranslations("media");
  const [filter, setFilter] = useState<MediaFilterValue>(ALL_FILTER);

  const filtered = useMemo(
    () => (filter === ALL_FILTER ? items : items.filter((p) => p.category.id === filter)),
    [items, filter]
  );

  const visible = limit ? filtered.slice(0, limit) : filtered;
  const hasMore = limit !== undefined && filtered.length > limit;

  return (
    <section id="media" className="relative py-24 sm:py-32">
      <div className="container-art section-px flex flex-col gap-12">
        <div className="flex flex-col items-start justify-between gap-8 lg:flex-row lg:items-end">
          <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} subheading={t("subheading")} />
          <Reveal delay={0.1} from="end">
            <MediaFilterTabs categories={categories} active={filter} onChange={setFilter} />
          </Reveal>
        </div>

        {visible.length === 0 ? (
          <p className="text-fluid-base text-ink-faint">{t("empty")}</p>
        ) : (
          <>
            <motion.div layout className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
              <AnimatePresence mode="popLayout">
                {visible.map((item) => (
                  <PressCard key={item.id} item={item} />
                ))}
              </AnimatePresence>
            </motion.div>

            {hasMore && (
              <Reveal className="flex justify-center">
                <Link
                  href="/media"
                  className="inline-flex items-center gap-2 rounded-full border border-ink/15 px-6 py-3 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
                >
                  {t("seeAll")}
                </Link>
              </Reveal>
            )}
          </>
        )}
      </div>
    </section>
  );
}
