"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession } from "@/lib/adminAuth";
import { withAuditLog } from "@/lib/auditLogger";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAuditLogRetention } from "./retention";

export type RetentionUpdateResult = { ok: true; deleted: number } | { ok: false };

/**
 * Saves how long audit log entries are kept, then applies it at once
 * (purge_audit_logs(), 0073) rather than at the nightly run, so a shorter
 * period deletes the older entries now. Gated on settings:manage, not just
 * audit:view — it erases history, and being able to read the log shouldn't
 * be enough for that. The change is logged before the purge, so its own
 * entry always survives it.
 */
export async function updateAuditLogRetention(retention: string): Promise<RetentionUpdateResult> {
  const session = await requireAdminSession(PERMISSIONS.settingsManage);
  if (!isAuditLogRetention(retention)) return { ok: false };
  const supabase = createAdminClient();

  try {
    await withAuditLog(session, "update_audit_log_retention", "audit_log_settings", async () => {
      const { data: before } = await supabase
        .from("audit_log_settings")
        .select("retention")
        .eq("id", 1)
        .maybeSingle();
      const { error } = await supabase
        .from("audit_log_settings")
        .upsert({ id: 1, retention, updated_at: new Date().toISOString() });
      if (error) throw new Error(error.message);
      return { result: undefined, before, after: { retention } };
    });
  } catch (err) {
    console.error("[audit-logs] retention save failed", err);
    return { ok: false };
  }

  const { data: deleted, error } = await supabase.rpc("purge_audit_logs");
  if (error) console.error("[audit-logs] purge failed", error.message);

  revalidatePath("/admin/audit-logs");
  return { ok: true, deleted: deleted ?? 0 };
}
