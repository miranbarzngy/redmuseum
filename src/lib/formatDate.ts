import type { Locale } from "@/i18n/routing";

const MONTHS: Record<Locale, string[]> = {
  en: [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ],
  ku: [
    "کانوونی دووەم", "شوبات", "ئازار", "نیسان", "ئایار", "حوزەیران",
    "تەمووز", "ئاب", "ئەیلوول", "تشرینی یەکەم", "تشرینی دووەم", "کانوونی یەکەم",
  ],
  ar: [
    "كانون الثاني", "شباط", "آذار", "نيسان", "أيار", "حزيران",
    "تموز", "آب", "أيلول", "تشرين الأول", "تشرين الثاني", "كانون الأول",
  ],
};

export function formatPressDate(iso: string, locale: Locale): string {
  const date = new Date(`${iso}T00:00:00`);
  const month = MONTHS[locale][date.getMonth()];
  return `${month} ${date.getFullYear()}`;
}
