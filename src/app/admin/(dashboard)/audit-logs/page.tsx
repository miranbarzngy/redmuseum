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
  // "create"/"update"/"delete" are the 3 generic buckets (see
  // GENERAL_ACTION_OPTIONS in AuditLogFilters.tsx) — "update" has no single
  // shared prefix (update_/reorder_/reset_/reactivate_/deactivate_/etc.),
  // so it's defined as "neither create nor delete" rather than matched
  // directly. Anything else is one of the specific booking actions
  // (BOOKING_ACTION_OPTIONS), matched by its exact action string.
  if (action === "create") query = query.ilike("action", "create_%");
  else if (action === "delete") query = query.ilike("action", "delete_%");
  else if (action === "update") {
    query = query.not("action", "ilike", "create_%").not("action", "ilike", "delete_%");
  } else if (action) query = query.eq("action", action);
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

  const [{ data: logs }, { data: users }, { data: roles }, { data: categories }] = await Promise.all([
    query,
    supabase.from("admin_users").select("id, full_name, email").order("full_name", { ascending: true }),
    supabase.from("admin_roles").select("id, name"),
    supabase.from("gallery_categories").select("id, label_ku"),
  ]);

  // Logs only ever stored an email snapshot (see admin_audit_logs.user_email
  // in src/lib/auditLogger.ts) — resolve it to the user's current display
  // name here, falling back to that snapshot email if the user was since
  // deleted, so history stays readable either way.
  const nameByUserId = new Map((users ?? []).map((u) => [u.id, u.full_name]));
  const logsWithNames = (logs ?? []).map((log) => ({
    ...log,
    user_name: (log.user_id && nameByUserId.get(log.user_id)) || log.user_email,
  }));

  // A few entities are ID-only in the log ("ئامانج" column shows the raw
  // UUID otherwise), which means nothing to a human — resolve each to its
  // display name. Live tables are the primary source; admin_users is
  // already fetched above (nameByUserId), and admin_roles is small enough
  // to fetch in full alongside it. Most actions don't snapshot the name
  // into `details` (e.g. updateBookingStatus in bookings/actions.ts only
  // logs `status`, to avoid duplicating booking PII into every entry), so
  // a delete — where the live row is gone by the time this renders — is the
  // one case that falls back to whatever name was snapshotted in `before`.
  const nameByRoleId = new Map((roles ?? []).map((r) => [r.id, r.name]));
  const bookingIds = Array.from(
    new Set(
      logsWithNames
        .filter((l) => l.target_entity === "bookings" && l.target_id)
        .map((l) => l.target_id as string)
    )
  );
  const { data: bookingRows } =
    bookingIds.length > 0
      ? await supabase.from("bookings").select("id, name").in("id", bookingIds)
      : { data: [] as { id: string; name: string }[] };
  const nameByBookingId = new Map((bookingRows ?? []).map((b) => [b.id, b.name]));

  // Gallery is a two-hop lookup — the log's target_id is the image, but the
  // one human-meaningful thing about it is which category it's filed under
  // (images mostly have no title — see the screenshot this was requested
  // from), so resolve image id → category_id → category label_ku.
  const categoryLabelById = new Map((categories ?? []).map((c) => [c.id, c.label_ku]));
  const galleryImageIds = Array.from(
    new Set(
      logsWithNames
        .filter((l) => l.target_entity === "gallery" && l.target_id)
        .map((l) => l.target_id as string)
    )
  );
  const { data: galleryRows } =
    galleryImageIds.length > 0
      ? await supabase.from("gallery").select("id, category_id").in("id", galleryImageIds)
      : { data: [] as { id: string; category_id: string }[] };
  const categoryIdByImageId = new Map((galleryRows ?? []).map((g) => [g.id, g.category_id]));

  function resolveGalleryCategoryLabel(log: (typeof logsWithNames)[number]): string | null {
    if (log.target_entity !== "gallery" || !log.target_id) return null;
    const before = log.details?.before as { category_id?: unknown } | null | undefined;
    const after = log.details?.after as { category_id?: unknown } | null | undefined;
    const categoryId =
      categoryIdByImageId.get(log.target_id) ??
      (typeof after?.category_id === "string" ? after.category_id : undefined) ??
      (typeof before?.category_id === "string" ? before.category_id : undefined);
    return categoryId ? (categoryLabelById.get(categoryId) ?? null) : null;
  }

  const LIVE_NAME_BY_ENTITY: Record<string, Map<string, string> | undefined> = {
    bookings: nameByBookingId,
    admin_roles: nameByRoleId,
    admin_users: nameByUserId,
  };
  const SNAPSHOT_FIELD_BY_ENTITY: Record<string, string | undefined> = {
    bookings: "name",
    admin_roles: "name",
    admin_users: "full_name",
  };

  function resolveTargetLabel(log: (typeof logsWithNames)[number]): string | null {
    const galleryLabel = resolveGalleryCategoryLabel(log);
    if (galleryLabel) return galleryLabel;
    if (!log.target_id) return null;
    const live = LIVE_NAME_BY_ENTITY[log.target_entity]?.get(log.target_id);
    if (live) return live;
    const field = SNAPSHOT_FIELD_BY_ENTITY[log.target_entity];
    if (!field) return null;
    const before = log.details?.before as Record<string, unknown> | null | undefined;
    const after = log.details?.after as Record<string, unknown> | null | undefined;
    const snapshot = after?.[field] ?? before?.[field];
    return typeof snapshot === "string" ? snapshot : null;
  }

  const logsWithTargets = logsWithNames.map((log) => ({
    ...log,
    target_label: resolveTargetLabel(log),
  }));

  return (
    <div className="flex flex-col gap-6 mb-24 lg:mb-0">
      <PageHeader title="تۆمارەکانی چاودێری" description="کردارەکانی هەموو بەکارهێنەرانی بەڕێوەبردن." />
      <AuditLogFilters users={users ?? []} />
      {logsWithTargets.length === 0 ? (
        <EmptyState icon={ClipboardList} title="هیچ تۆمارێک نەدۆزرایەوە" />
      ) : (
        <AuditLogGrid logs={logsWithTargets} />
      )}
    </div>
  );
}
