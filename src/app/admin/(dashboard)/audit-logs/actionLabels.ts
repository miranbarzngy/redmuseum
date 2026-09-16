import type { AdminAuditLogRow } from "@/lib/supabase/database.types";

const ENTITY_LABELS: Record<string, string> = {
  gallery: "گەلەری",
  admin_users: "بەکارهێنەرانی بەڕێوەبردن",
  admin_roles: "ڕۆڵەکان",
  bookings: "سەردانەکان",
};

/** target_entity is a raw table name ("gallery", "admin_roles", …) — this
 * is its Kurdish label for display, e.g. in the "ئامانج" column. */
export function translateAuditEntity(entity: string): string {
  return ENTITY_LABELS[entity] ?? entity;
}

/** The "ئامانج" column's prefix before the resolved target_label (see
 * page.tsx) — or null to show no prefix at all. Once a specific name is
 * resolved (a role's name, a booking's visitor, …), the action label
 * already says what kind of thing it is ("زیادکردنی ڕۆڵی نوێ" already means
 * "role"), so repeating the generic entity label next to it is redundant;
 * this returns null in that case and the caller shows target_label alone.
 * update_admin_user is the one exception that still needs a prefix even
 * with a resolved name — it covers several unrelated changes, so when the
 * diff shows the display name itself changed, that's worth calling out
 * explicitly rather than showing nothing. */
export function describeAuditTargetPrefix(
  log: Pick<AdminAuditLogRow, "action" | "target_entity" | "details"> & {
    target_label?: string | null;
  }
): string | null {
  if (log.action === "update_admin_user") {
    const before = log.details?.before as { full_name?: unknown } | null | undefined;
    const after = log.details?.after as { full_name?: unknown } | null | undefined;
    if (
      typeof before?.full_name === "string" &&
      typeof after?.full_name === "string" &&
      before.full_name !== after.full_name
    ) {
      return "ناوی نوێکراوە";
    }
  }
  if (log.target_label) return null;
  return translateAuditEntity(log.target_entity);
}

// Every action gets its own specific wording instead of collapsing to a
// generic create/update/delete bucket — "زیادکردنی ڕۆڵی نوێ" vs. just
// "زیادکردن" is the difference between the log being readable at a glance
// and needing the "ئامانج" column and a mental table-name lookup to make
// sense of every single row.
const ACTION_LABELS: Record<string, string> = {
  // gallery
  create_gallery_image: "زیادکردنی وێنەیەکی نوێ",
  update_gallery_image: "نوێکردنەوەی وێنە",
  delete_gallery_image: "سڕینەوەی وێنە",
  reorder_gallery_images: "ڕیزکردنەوەی وێنەکان",
  // admin_users
  create_admin_user: "زیادکردنی بەکارهێنەرێکی نوێ",
  update_admin_user: "نوێکردنەوەی بەکارهێنەر",
  reset_admin_user_password: "ڕیسێتکردنەوەی وشەی نهێنی",
  reactivate_admin_user: "چالاککردنەوەی بەکارهێنەر",
  deactivate_admin_user: "ناچالاککردنی بەکارهێنەر",
  // admin_roles
  create_admin_role: "زیادکردنی ڕۆڵی نوێ",
  update_admin_role: "نوێکردنەوەی ڕۆڵ",
  delete_admin_role: "سڕینەوەی ڕۆڵ",
  // bookings
  accept_booking: "پەسەندکردنی سەردان",
  decline_booking: "ڕەتکردنەوەی سەردان",
  mark_booking_visited: "دیاریکردن وەک هاتوو",
  mark_booking_not_visited: "دیاریکردن وەک نەهاتوو",
  print_booking: "چاپکردنی سەردان",
  update_booking_status: "نوێکردنەوەی دۆخی سەردان",
  delete_booking: "سڕینەوەی سەردان",
};

/** Fallback for any action not in ACTION_LABELS above (e.g. a newly added
 * one nobody's labelled yet) — every action string written by withAuditLog
 * (see src/lib/auditLogger.ts callers) still follows a create_/update_/
 * delete_ naming convention, so this at least says which of the three it
 * was rather than showing the raw snake_case string. */
export function translateAuditAction(action: string): string {
  if (ACTION_LABELS[action]) return ACTION_LABELS[action];
  if (action.startsWith("create_")) return "زیادکردن";
  if (action.startsWith("delete_")) return "سڕینەوە";
  return "نوێکردنەوە";
}

/** update_gallery_image covers everything about an image — title, photo,
 * category, and its گشتی/تایبەت toggle alike — so the generic "نوێکردنەوە"
 * hides the one change an admin scanning the log most wants to spot: an
 * image going active/inactive. When that's what the diff shows, say so. */
export function describeAuditAction(log: Pick<AdminAuditLogRow, "action" | "details">): string {
  if (log.action === "update_gallery_image") {
    const before = log.details?.before as { is_active?: unknown } | null | undefined;
    const after = log.details?.after as { is_active?: unknown } | null | undefined;
    if (
      typeof before?.is_active === "boolean" &&
      typeof after?.is_active === "boolean" &&
      before.is_active !== after.is_active
    ) {
      return after.is_active ? "چالاککردنەوەی وێنە" : "ناچالاککردنی وێنە";
    }
  }
  return translateAuditAction(log.action);
}
