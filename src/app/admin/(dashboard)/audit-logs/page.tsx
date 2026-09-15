import { ClipboardList } from "lucide-react";
import { requireAdminSession } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { AuditLogFilters } from "./AuditLogFilters";
import { AuditLogGrid } from "./AuditLogGrid";

const PAGE_SIZE = 100;

export default async function AuditLogsPage({
  searchParams,
}: {
  searchParams: Promise<{ from?: string; to?: string; user?: string; action?: string; q?: string }>;
}) {
  await requireAdminSession(PERMISSIONS.auditView);
  const { from, to, user, action, q } = await searchParams;
  const supabase = createAdminClient();

  let query = supabase
    .from("admin_audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(PAGE_SIZE);

  if (from) query = query.gte("created_at", from);
  if (to) query = query.lte("created_at", `${to}T23:59:59`);
  if (user) query = query.eq("user_id", user);
  if (action) query = query.eq("action", action);
  if (q) {
    // Strip characters meaningful to PostgREST's .or() filter grammar so a
    // stray comma/parenthesis in the search box can't break the filter —
    // this admin already has full read access via this same service-role
    // client either way, so it's a correctness fix, not a security boundary.
    const safeQ = q.replace(/[,()]/g, "");
    if (safeQ) {
      query = query.or(
        `target_id.ilike.%${safeQ}%,target_entity.ilike.%${safeQ}%,action.ilike.%${safeQ}%`
      );
    }
  }

  const [{ data: logs }, { data: users }, { data: actionRows }] = await Promise.all([
    query,
    supabase.from("admin_users").select("id, email").order("email", { ascending: true }),
    supabase.from("admin_audit_logs").select("action").limit(1000),
  ]);

  const distinctActions = Array.from(new Set((actionRows ?? []).map((r) => r.action))).sort();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="تۆمارەکانی چاودێری" description="کردارەکانی هەموو بەکارهێنەرانی بەڕێوەبردن." />
      <AuditLogFilters users={users ?? []} actions={distinctActions} />
      {(logs?.length ?? 0) === 0 ? (
        <EmptyState icon={ClipboardList} title="هیچ تۆمارێک نەدۆزرایەوە" />
      ) : (
        <AuditLogGrid logs={logs ?? []} />
      )}
    </div>
  );
}
