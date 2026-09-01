import { createAdminClient } from "@/lib/supabase/admin";
import { formatVisitDate, formatSubmittedAt } from "./bookings/formatBookingDate";
import { VISITOR_TYPE_LABELS } from "./bookings/visitorType";
import type { BookingVisitorType } from "@/lib/supabase/database.types";
import {
  EMPTY_ADMIN_NOTIFICATIONS,
  type AdminNotificationItem,
  type AdminNotifications,
} from "../_components/adminNotificationsShape";

// Feeds the bottom-nav notification bell (src/app/admin/_components/
// NotificationsBell.tsx). "A notification" in this single-admin app is just
// an unactioned inbound row: a booking still `pending` confirmation, or a
// contact message not yet marked read. There's no separate notifications
// table — this rolls the two up into one newest-first list plus the totals
// the bell badge needs.
//
// Gated by (dashboard)/layout.tsx's own requireAdminSession() check — see
// the allowed-call-sites list on createAdminClient() — so it's safe to read
// bookings / contact_messages (no anon RLS) with the service-role client.

const LIST_LIMIT = 8;

function messageSnippet(message: string): string {
  const trimmed = message.trim();
  return trimmed.length > 70 ? `${trimmed.slice(0, 70)}…` : trimmed;
}

export async function getAdminNotifications(): Promise<AdminNotifications> {
  const supabase = createAdminClient();

  const [bookingsRes, messagesRes] = await Promise.all([
    supabase
      .from("bookings")
      .select("id, name, guest_count, visitor_type, visit_date, created_at", { count: "exact" })
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
    supabase
      .from("contact_messages")
      .select("id, name, message, created_at", { count: "exact" })
      .eq("is_read", false)
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
  ]);

  if (bookingsRes.error || messagesRes.error) {
    console.error(
      "[getAdminNotifications] query failed",
      bookingsRes.error?.message ?? messagesRes.error?.message,
    );
    return EMPTY_ADMIN_NOTIFICATIONS;
  }

  const bookingItems: AdminNotificationItem[] = (bookingsRes.data ?? []).map((b) => ({
    kind: "booking",
    id: b.id,
    name: b.name,
    detail: `${VISITOR_TYPE_LABELS[b.visitor_type as BookingVisitorType]} · ${b.guest_count} کەس · ${formatVisitDate(b.visit_date)}`,
    atLabel: formatSubmittedAt(b.created_at),
    at: b.created_at,
    href: `/admin/bookings?view=${b.id}`,
  }));

  const messageItems: AdminNotificationItem[] = (messagesRes.data ?? []).map((m) => ({
    kind: "message",
    id: m.id,
    name: m.name,
    detail: messageSnippet(m.message),
    atLabel: formatSubmittedAt(m.created_at),
    at: m.created_at,
    href: `/admin/messages/${m.id}`,
  }));

  const items = [...bookingItems, ...messageItems]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, LIST_LIMIT);

  const pendingBookings = bookingsRes.count ?? bookingItems.length;
  const unreadMessages = messagesRes.count ?? messageItems.length;

  return {
    total: pendingBookings + unreadMessages,
    pendingBookings,
    unreadMessages,
    items,
  };
}
