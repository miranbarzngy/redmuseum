"use client";

import { useTransition } from "react";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

export function LanguageSwitcher({ className }: { className?: string }) {
  const t = useTranslations("languageSwitcher");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function switchTo(next: string) {
    if (next === locale) return;
    startTransition(() => {
      router.replace(pathname, { locale: next, scroll: false });
    });
  }

  return (
    <div
      role="group"
      aria-label={t("label")}
      className={`inline-flex items-center gap-1 rounded-full border border-ink/10 bg-canvas/70 p-1 shadow-ring backdrop-blur-md ${className ?? ""}`}
    >
      {routing.locales.map((loc) => {
        const active = loc === locale;
        return (
          <button
            key={loc}
            type="button"
            onClick={() => switchTo(loc)}
            disabled={isPending}
            aria-current={active}
            className="relative rounded-full px-3 py-1.5 text-fluid-xs font-medium transition-colors disabled:cursor-wait"
          >
            {active && (
              <motion.span
                layoutId="lang-pill"
                className="absolute inset-0 rounded-full bg-ink"
                transition={{ type: "spring", stiffness: 320, damping: 30 }}
              />
            )}
            <span
              className={`relative z-10 ${active ? "text-canvas" : "text-ink-soft hover:text-ink"}`}
            >
              {t(loc)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
