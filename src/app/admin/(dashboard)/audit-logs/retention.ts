import type { AuditLogRetention } from "@/lib/supabase/database.types";

/** The audit log retention choices, shortest first. `days` only ranks them —
 * moving to a shorter period deletes entries straight away, so the control
 * asks first; the real cutoffs live in purge_audit_logs() (0073). */
export const AUDIT_RETENTION_OPTIONS: { value: AuditLogRetention; label: string; days: number }[] = [
  { value: "1_week", label: "1 هەفتە", days: 7 },
  { value: "1_month", label: "1 مانگ", days: 30 },
  { value: "keep_all", label: "هەمووی بهێڵەرەوە", days: Infinity },
];

export const DEFAULT_AUDIT_RETENTION: AuditLogRetention = "keep_all";

export function isAuditLogRetention(value: unknown): value is AuditLogRetention {
  return AUDIT_RETENTION_OPTIONS.some((option) => option.value === value);
}
