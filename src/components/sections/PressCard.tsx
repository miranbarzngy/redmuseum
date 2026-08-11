"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ArrowUpRight, FileText, Mic, BookOpen, Newspaper } from "lucide-react";
import { Link } from "@/i18n/navigation";
import type { PressItem } from "@/data/press";
import type { Locale } from "@/i18n/routing";
import { formatPressDate } from "@/lib/formatDate";

// Keyed by the original three seeded category slugs — any category the
// admin adds beyond those falls back to a generic icon rather than crashing.
const ICONS: Record<string, typeof Newspaper> = {
  interview: Mic,
  article: FileText,
  publication: BookOpen,
};

const MotionLink = motion.create(Link);

export function PressCard({ item }: { item: PressItem }) {
  const locale = useLocale() as Locale;
  const t = useTranslations("media");
  const Icon = ICONS[item.category.slug] ?? Newspaper;

  return (
    <MotionLink
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      href={`/media/${item.id}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl border border-ink/10 bg-white shadow-card transition-all hover:-translate-y-1 hover:shadow-soft"
    >
      {item.imageUrl && (
        <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden bg-canvas-paper">
          <Image
            src={item.imageUrl}
            alt=""
            fill
            sizes="(min-width: 1280px) 33vw, (min-width: 768px) 50vw, 100vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
      )}
      <div className="flex flex-1 flex-col gap-4 p-6">
        <div className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-fluid-xs font-medium uppercase tracking-[0.15em] text-pigment-teal">
            <Icon size={14} /> {item.outlet}
          </span>
          <ArrowUpRight
            size={14}
            className="icon-flip shrink-0 text-ink-faint transition-colors group-hover:text-pigment-terracotta"
          />
        </div>
        <h3 className="font-display text-fluid-lg font-semibold leading-snug text-ink">
          {item.title[locale]}
        </h3>
        <p className="flex-1 text-fluid-sm leading-relaxed text-ink-soft">{item.excerpt[locale]}</p>
        <div className="flex items-center justify-between border-t border-ink/10 pt-4 text-fluid-xs text-ink-faint">
          <span>{formatPressDate(item.date, locale)}</span>
          <span className="font-medium text-pigment-terracotta">{t("readMore")}</span>
        </div>
      </div>
    </MotionLink>
  );
}
