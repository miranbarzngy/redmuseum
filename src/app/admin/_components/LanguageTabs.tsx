"use client";

import { createContext, useContext, useState } from "react";
import clsx from "clsx";

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

/** The single language switch for a form. Renders nothing outside a provider. */
export function LanguageTabs({ className }: { className?: string }) {
  const ctx = useLanguage();
  if (!ctx) return null;

  return (
    <div
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border border-ink/10 bg-canvas-paper p-1",
        className
      )}
    >
      {ADMIN_LANGS.map((lang) => {
        const isActive = ctx.active === lang.code;
        return (
          <button
            key={lang.code}
            type="button"
            onClick={() => ctx.setActive(lang.code)}
            className={clsx(
              "font-kurdish rounded-full px-3.5 py-1.5 text-fluid-xs font-medium transition-colors",
              isActive ? "bg-ink text-canvas" : "text-ink-soft hover:text-ink"
            )}
          >
            {lang.label}
          </button>
        );
      })}
    </div>
  );
}
