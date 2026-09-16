// Shared shape for the admin notification bell + modal. Deliberately free of
// any server-only import — (dashboard)/getAdminNotifications.ts builds this
// data with the service-role client, but the client components only need
// the type and an empty fallback, and importing those from the data module
// would drag "server-only" into the browser bundle.
//
// Each variant mirrors its source table (`bookings` / `contact_messages`)
// closely, just camelCased and pre-formatted — dates/times go through the
// same formatVisitDate()/formatSubmittedAt() helpers the rest of /admin
// uses, so digits stay ASCII and the client never re-parses timestamps.

export type AdminBookingNotification = {
  kind: "booking";
  id: string;
  name: string;
  phone: string;
  guestCount: number;
  /** Kurdish label, e.g. "سەردانی کەسی" / "وەفدی فەرمی". */
  visitorType: string;
  /** Pre-formatted visit date, LTR ("YYYY-MM-DD"). */
  visitDate: string;
  /** Pre-formatted submission timestamp, LTR. */
  submittedAt: string;
  href: string;
};

export type AdminMessageNotification = {
  kind: "message";
  id: string;
  name: string;
  phone: string;
  /** Truncated message body. */
  preview: string;
  /** Pre-formatted submission timestamp, LTR. */
  submittedAt: string;
  href: string;
};

export type AdminNotificationItem = AdminBookingNotification | AdminMessageNotification;

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
