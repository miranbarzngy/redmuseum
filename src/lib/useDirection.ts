"use client";

import { useLocale } from "next-intl";
import { rtlLocales } from "@/i18n/routing";

export function useDirection(): "rtl" | "ltr" {
  const locale = useLocale();
  return (rtlLocales as string[]).includes(locale) ? "rtl" : "ltr";
}
