"use client";

import { createContext, useContext, useState } from "react";
import clsx from "clsx";
import { slidingIndicatorMotion, useSlidingIndicator } from "./useSlidingIndicator";

export const ADMIN_LANGS = [
  { code: "ku", label: "کوردی", dir: "rtl" as const },
  { code: "en", label: "ئینگلیزی", dir: "ltr" as const },
  { code: "ar", label: "عەرەبی", dir: "rtl" as const },
] as const;

export type LangCode = (typeof ADMIN_LANGS)[number]["code"];

type LanguageCtx = { active: LangCode; setActive: (c: LangCode) => void };
const LanguageContext = createContext<LanguageCtx | null>(null);

export function useLanguage() {
  return useContext(LanguageContext);
}

/** Wrap a whole <form> in this so its <LocalizedField>s and one
 * <LanguageTabs> switch share a single active language. */
export function LanguageProvider({
  children,
  initial = "ku",
}: {
  children: React.ReactNode;
  initial?: LangCode;
}) {
  const [active, setActive] = useState<LangCode>(initial);
  return (
    <LanguageContext.Provider value={{ active, setActive }}>{children}</LanguageContext.Provider>
  );
}

/** The single language switch for a form. Renders nothing outside a provider.
 * An iOS-style segmented control: a gray track with a raised white pill
 * that springs to the picked language. */
export function LanguageTabs({ className }: { className?: string }) {
  const ctx = useLanguage();
  if (!ctx) return null;
  return <Segments active={ctx.active} onPick={ctx.setActive} className={className} />;
}

function Segments({
  active,
  onPick,
  className,
}: {
  active: LangCode;
  onPick: (code: LangCode) => void;
  className?: string;
}) {
  const { containerRef, indicatorRef } = useSlidingIndicator<HTMLDivElement, HTMLSpanElement>(active);

  return (
    <div
      ref={containerRef}
      className={clsx("group/pill relative inline-flex items-center gap-0.5 rounded-full bg-ink/[0.06] p-1", className)}
    >
      <span
        ref={indicatorRef}
        aria-hidden
        className={clsx(
          "pointer-events-none absolute left-0 top-0 rounded-full bg-white opacity-0 shadow-[0_1px_3px_rgba(28,27,25,0.14),0_1px_1px_rgba(28,27,25,0.06)]",
          slidingIndicatorMotion
        )}
      />
      {ADMIN_LANGS.map((lang) => {
        const isActive = active === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => onPick(lang.code)}
            data-active={isActive}
            aria-pressed={isActive}
            className={clsx(
              "font-kurdish relative rounded-full px-3.5 py-1.5 text-fluid-xs transition-[color,transform] duration-200 active:scale-95",
              // Until the sliding pill is placed, the active button draws
              // the same white pill itself (see useSlidingIndicator).
              isActive
                ? "bg-white font-semibold text-brand shadow-[0_1px_3px_rgba(28,27,25,0.14),0_1px_1px_rgba(28,27,25,0.06)] group-data-[pill=ready]/pill:bg-transparent group-data-[pill=ready]/pill:shadow-none"
                : "font-medium text-ink-soft hover:text-ink"
            )}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
