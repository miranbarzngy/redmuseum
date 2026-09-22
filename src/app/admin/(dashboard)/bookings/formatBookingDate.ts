export function formatVisitDate(iso: string): string {
  // visit_date is a plain SQL date ("YYYY-MM-DD"), not a timestamp — parsing
  // it as UTC and reading UTC fields avoids the browser's local timezone
  // shifting it to the day before/after.
  const date = new Date(`${iso}T00:00:00Z`);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

const ARABIC_INDIC = ["٠", "١", "٢", "٣", "٤", "٥", "٦", "٧", "٨", "٩"];
const WEEKDAYS = ["یەک شەمە", "دوو شەمە", "سێ شەمە", "چوار شەمە", "پێنج شەمە", "هەینی", "شەمە"];
const MERIDIEM = { am: "بەیانی", pm: "دوا نیوەڕۆ" };

function localizeDigits(value: string | number): string {
  return String(value).replace(/[0-9]/g, (d) => ARABIC_INDIC[Number(d)]);
}

/** "ڕۆژی شەمە کاتژمێر ١:٠٠ دوا نیوەڕۆ" — the visit's weekday (from
 * visit_date) plus its booked slot (visit_time, 24h "HH:MM"; see 0052),
 * converted to 12-hour + بەیانی/دوا نیوەڕۆ with Eastern Arabic-Indic digits
 * to match the public booking form's own time-slot picker style. This is a
 * deliberate exception to the rest of the admin panel's plain-ASCII-digits
 * rule, used only for this card's prominent weekday+time line. Falls back
 * to just the weekday when there's no time (bookings made before 0052). */
export function formatVisitWeekdayAndTime(visitDate: string, visitTime: string | null): string {
  const date = new Date(`${visitDate}T00:00:00Z`);
  const dayLabel = `ڕۆژی ${WEEKDAYS[date.getUTCDay()]}`;
  if (!visitTime) return dayLabel;

  const [hourStr, minuteStr] = visitTime.split(":");
  const hour = Number(hourStr);
  const period = hour < 12 ? MERIDIEM.am : MERIDIEM.pm;
  const hour12 = ((hour + 11) % 12) + 1;
  const localizedTime = `${localizeDigits(hour12)}:${localizeDigits(minuteStr)}`;
  return `${dayLabel} کاتژمێر ${localizedTime} ${period}`;
}

export function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
