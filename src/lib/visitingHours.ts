import { localizeDigits } from "@/lib/kurdishCalendar";

// Groups open weekdays into runs of consecutive days ("Sat, Sun, Mon" -> one
// "Sat–Mon" run), merging a run that wraps past Saturday back to Sunday into
// the run starting at Sunday so a schedule like "closed only on Friday"
// reads as a single "Sat–Thu" range instead of two split pieces.
export function groupContiguousDays(days: number[]): number[][] {
  if (days.length === 0) return [];
  const sorted = [...new Set(days)].sort((a, b) => a - b);
  const groups: number[][] = [];
  let current = [sorted[0]];
  for (let i = 1; i < sorted.length; i++) {
    if (sorted[i] === current[current.length - 1] + 1) {
      current.push(sorted[i]);
    } else {
      groups.push(current);
      current = [sorted[i]];
    }
  }
  groups.push(current);

  if (groups.length > 1) {
    const first = groups[0];
    const last = groups[groups.length - 1];
    if (first[0] === 0 && last[last.length - 1] === 6) {
      groups[0] = [...last, ...first];
      groups.pop();
    }
  }
  return groups;
}

export function addHour(hhmm: string): string {
  const hour = Number(hhmm.split(":")[0]);
  return `${String((hour + 1) % 24).padStart(2, "0")}:00`;
}

export function formatHour(hhmm: string, locale: string, meridiem: { am: string; pm: string }): string {
  const hour24 = Number(hhmm.split(":")[0]);
  const period = hour24 < 12 ? meridiem.am : meridiem.pm;
  const hour12 = ((hour24 + 11) % 12) + 1;
  return `${localizeDigits(hour12, locale)}:${localizeDigits("00", locale)} ${period}`;
}

/**
 * "Sat–Thu" + "9:00 AM – 4:00 PM" (or a closed label when no slots are
 * configured) from booking_settings — shared by the footer's hours widget
 * and the /contact page's hours card so both read the same live schedule.
 */
export function formatVisitingHours({
  openWeekdays,
  timeSlots,
  locale,
  weekdayLabels,
  meridiem,
  closedLabel,
}: {
  openWeekdays: number[];
  timeSlots: string[];
  locale: string;
  weekdayLabels: string[];
  meridiem: { am: string; pm: string };
  closedLabel: string;
}): { daysText: string; hoursText: string } {
  const daySeparator = locale === "en" ? ", " : "، ";
  const daysText = groupContiguousDays(openWeekdays)
    .map((group) =>
      group.length === 1
        ? weekdayLabels[group[0]]
        : `${weekdayLabels[group[0]]}–${weekdayLabels[group[group.length - 1]]}`
    )
    .join(daySeparator);

  const sortedSlots = [...timeSlots].sort();
  const hoursText =
    sortedSlots.length > 0
      ? `${formatHour(sortedSlots[0], locale, meridiem)} – ${formatHour(
          addHour(sortedSlots[sortedSlots.length - 1]),
          locale,
          meridiem
        )}`
      : closedLabel;

  return { daysText, hoursText };
}
