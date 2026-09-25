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

/** Whether a holder of `granted` may hand out every permission in
 * `requested` — i.e. `requested` is a subset of what they already hold.
 * Only a `"*"` holder can grant `"*"`. Used by the users/roles actions so
 * `users:manage` can never be leveraged into more access than its holder
 * already has. */
export function canGrant(granted: string[], requested: string[]): boolean {
  return requested.every((p) => hasPermission(granted, p));
}

const KNOWN_PERMISSIONS = new Set<string>(Object.values(PERMISSIONS));

export function isKnownPermission(value: string): value is Permission {
  return KNOWN_PERMISSIONS.has(value);
}
