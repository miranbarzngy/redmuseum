// Helpers for the Kurdish-flavoured date picker in the booking flow: localized
// digits (Arabic-Indic for ku/ar) and holiday detection for the days on screen.

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];

/** Render a number with Arabic-Indic digits for ku/ar, plain digits for en. */
export function localizeDigits(value: string | number, locale: string): string {
  const s = String(value);
  if (locale === "en") return s;
  return s.replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

// Fixed-date holidays observed in the Kurdistan Region of Iraq, keyed by MM-DD.
// The values are message keys under `booking.holidays`.
const FIXED_HOLIDAYS: Record<string, string> = {
  "01-01": "newYear",
  "03-05": "raparin", // Sulaymaniyah uprising, 1991
  "03-16": "halabja", // chemical attack memorial, 1988
  "03-21": "newroz",
  "05-01": "labourDay",
  "12-17": "flagDay", // Kurdistan flag day
  "12-25": "christmas",
};

// The Islamic holidays drift ~11 days a year, so resolve them from the Hijri
// date rather than a fixed Gregorian one.
const hijriFormatter = new Intl.DateTimeFormat("en-US-u-ca-islamic-umalqura", {
  day: "numeric",
  month: "numeric",
});

function hijriMonthDay(date: Date): { month: number; day: number } {
  const parts = hijriFormatter.formatToParts(date);
  return {
    month: Number(parts.find((p) => p.type === "month")?.value),
    day: Number(parts.find((p) => p.type === "day")?.value),
  };
}

/** Message key under `booking.holidays` for this day, or null if it's ordinary. */
export function holidayKeyFor(date: Date): string | null {
  const mmdd = `${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
  if (FIXED_HOLIDAYS[mmdd]) return FIXED_HOLIDAYS[mmdd];

  const { month, day } = hijriMonthDay(date);
  if (month === 10 && day >= 1 && day <= 3) return "eidFitr";
  if (month === 12 && day >= 10 && day <= 13) return "eidAdha";
  return null;
}
