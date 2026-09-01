// Shared shape for the bottom-nav notification bell. Deliberately free of
// any server-only import — (dashboard)/getAdminNotifications.ts builds this
// data with the service-role client, but the client bell and AdminShell
// only need the type and an empty fallback, and importing those from the
// data module would drag "server-only" into the browser bundle.

export type AdminNotificationItem = {
  kind: "booking" | "message";
  id: string;
  name: string;
  /** One-line supporting text (visit details / message snippet). */
  detail: string;
  /** Pre-formatted timestamp for display, LTR. */
  atLabel: string;
  /** Sort key — raw ISO `created_at`. */
  at: string;
  /** In-app path the row links to. */
  href: string;
};

export type AdminNotifications = {
  total: number;
  pendingBookings: number;
  unreadMessages: number;
  items: AdminNotificationItem[];
};

export const EMPTY_ADMIN_NOTIFICATIONS: AdminNotifications = {
  total: 0,
  pendingBookings: 0,
  unreadMessages: 0,
  items: [],
};
