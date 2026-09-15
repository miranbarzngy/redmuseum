// English AM/PM rather than the Kurdish meridiem labels the public booking
// flow uses (messages/ku.json's booking.form.meridiem) — admin keeps times
// in plain English digits/labels throughout, matching the rest of this file.
const MERIDIEM = { am: "AM", pm: "PM" };

const pad = (n: number) => String(n).padStart(2, "0");

function formatDatePart(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function formatTimePart(date: Date): string {
  const hours24 = date.getHours();
  const hours12 = ((hours24 + 11) % 12) + 1;
  const period = hours24 < 12 ? MERIDIEM.am : MERIDIEM.pm;
  return `${hours12}:${pad(date.getMinutes())} ${period}`;
}

/** Date and time as separate strings, for layouts that stack them on two
 * lines instead of running them together (e.g. MessageGrid, the dashboard's
 * unread-messages panel). */
export function formatMessageDateParts(iso: string): { date: string; time: string } {
  const date = new Date(iso);
  return { date: formatDatePart(date), time: formatTimePart(date) };
}

export function formatMessageDate(iso: string): string {
  const date = new Date(iso);
  return `${formatDatePart(date)} ${formatTimePart(date)}`;
}
