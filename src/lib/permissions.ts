/** Permission strings a role's `admin_roles.permissions` array can hold.
 * `"*"` (checked in hasPermission below) means "every permission" — the
 * Super Admin role seeded by 0041_admin_rbac_and_audit_log.sql uses it
 * instead of enumerating every key here. */
export const PERMISSIONS = {
  profileManage: "profile:manage",
  museumsManage: "museums:manage",
  museumHistoryManage: "museumhistory:manage",
  galleryManage: "gallery:manage",
  bookingsManage: "bookings:manage",
  messagesManage: "messages:manage",
  usersManage: "users:manage",
  auditView: "audit:view",
  settingsManage: "settings:manage",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export function hasPermission(granted: string[], required: string): boolean {
  return granted.includes("*") || granted.includes(required);
}
