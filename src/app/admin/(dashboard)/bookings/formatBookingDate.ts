export function formatVisitDate(iso: string): string {
  // visit_date is a plain SQL date ("YYYY-MM-DD"), not a timestamp — parsing
  // it as UTC and reading UTC fields avoids the browser's local timezone
  // shifting it to the day before/after.
  const date = new Date(`${iso}T00:00:00Z`);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())}`;
}

export function formatSubmittedAt(iso: string): string {
  const date = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}
