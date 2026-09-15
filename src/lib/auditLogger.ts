import "server-only";
import { headers } from "next/headers";
import { createAdminClient } from "./supabase/admin";
import { clientIp } from "./clientIp";
import type { AdminSession } from "./adminAuth";

export type AuditResult<T> = {
  result: T;
  /** id of the row the action targeted — omit for actions with no single target. */
  targetId?: string | null;
  before?: unknown;
  after?: unknown;
};

/**
 * Wraps a Server Action's mutation with an audit-log write. `handler` does
 * the real work and reports what changed — it's the only thing that knows
 * the before/after rows (and, for inserts, the new id) — this wrapper just
 * captures the actor/IP/user-agent and persists the record.
 *
 * The audit write is best-effort: like /api/track-visit, telemetry must
 * never break the primary action, so a failed insert here is logged to the
 * server console and swallowed rather than thrown. If `handler` itself
 * throws, nothing is logged — the mutation didn't happen, so there's
 * nothing to record.
 */
export async function withAuditLog<T>(
  session: Pick<AdminSession, "id" | "email">,
  action: string,
  targetEntity: string,
  handler: () => Promise<AuditResult<T>>
): Promise<T> {
  const { result, targetId, before, after } = await handler();

  try {
    const userAgent = (await headers()).get("user-agent");
    const supabase = createAdminClient();
    const { error } = await supabase.from("admin_audit_logs").insert({
      user_id: session.id,
      user_email: session.email,
      action,
      target_entity: targetEntity,
      target_id: targetId ?? null,
      details: { before: before ?? null, after: after ?? null, user_agent: userAgent },
      ip_address: await clientIp(),
    });
    if (error) console.error("admin_audit_logs insert failed:", error.message);
  } catch (err) {
    console.error("admin_audit_logs insert failed:", err);
  }

  return result;
}
