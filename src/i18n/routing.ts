import { defineRouting } from "next-intl/routing";

export const locales = ["ku", "ar", "en"] as const;
export type Locale = (typeof locales)[number];

export const rtlLocales: Locale[] = ["ku", "ar"];

export const routing = defineRouting({
  locales,
  defaultLocale: "ku",
  localePrefix: "always",
  localeDetection: false,
});

export function getDirection(locale: string): "rtl" | "ltr" {
  return (rtlLocales as string[]).includes(locale) ? "rtl" : "ltr";
}
