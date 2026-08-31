/**
 * Shipped copy for the four homepage stat cards flanking the logo emblem
 * (see HeroLogoStrip / MuseumStatsPanel), used whenever site_profile has no
 * saved value for a field. Values are canonical Western digits — the panel
 * formats them per locale (Western for en, Arabic-Indic for ku/ar). Labels
 * carry the ku/en/ar triple like every other localized field, and the admin
 * profile form prefills its inputs from here.
 */
export const statDefaults = {
  museums: {
    value: "11",
    label: { ku: "مۆزە", en: "Museums", ar: "متاحف" },
  },
  archive: {
    value: "1,898",
    label: { ku: "پارچە ئەرشیف", en: "Archive items", ar: "قطعة أرشيفية" },
  },
  activities: {
    value: "+50",
    label: { ku: "چالاکی ساڵانە", en: "Annual activities", ar: "فعالية سنوية" },
  },
  visitors: {
    value: "20,000",
    label: { ku: "سەردانیکەر ساڵانە", en: "Annual visitors", ar: "زائر سنويًا" },
  },
} as const;

export type StatKey = keyof typeof statDefaults;
