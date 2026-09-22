import { createAdminClient } from "@/lib/supabase/admin";
import { formatVisitDate, formatSubmittedAt } from "./bookings/formatBookingDate";
import {
  EMPTY_ADMIN_NOTIFICATIONS,
  type AdminNotificationItem,
  type AdminNotifications,
} from "../_components/adminNotificationsShape";

// Feeds the notification bell + modal (src/app/admin/_components/
// NotificationsBell.tsx, NotificationModal.tsx). "A notification" in this
// single-admin app is just an unactioned inbound row: a booking still
// `pending` confirmation, or a contact message not yet marked read. There's
// no separate notifications table — this rolls the two up into one
// newest-first list plus the totals the bell badge needs.
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
      .select(
        "id, name, phone, guest_count, visit_date, created_at, face_image_path, visitor_type:booking_visitor_types(label_ku)",
        { count: "exact" },
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false })
      .limit(LIST_LIMIT),
    supabase
      .from("contact_messages")
      .select("id, name, phone, message, created_at", { count: "exact" })
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

  // database.types.ts is hand-written and has no Relationships metadata, so
  // the joined select's shape above must be described locally (same pattern
  // as src/lib/data/gallery.ts).
  const bookingRows = (bookingsRes.data ?? []) as unknown as {
    id: string;
    name: string;
    phone: string;
    guest_count: number;
    visit_date: string;
    created_at: string;
    face_image_path: string | null;
    visitor_type: { label_ku: string } | null;
  }[];

  // One signed-url batch call for every notification's photo instead of N —
  // same face-scans bucket rules as bookings/actions.ts's getFacePhotoUrls.
  const facePhotoPaths = bookingRows
    .map((b) => b.face_image_path)
    .filter((path): path is string => Boolean(path));
  const facePhotoUrls: Record<string, string> = {};
  if (facePhotoPaths.length > 0) {
    const { data: signed, error: signError } = await supabase.storage
      .from("face-scans")
      .createSignedUrls(facePhotoPaths, 300);
    if (signError) {
      console.error("[getAdminNotifications] failed to sign face photo urls", signError.message);
    } else {
      for (const entry of signed) {
        if (entry.signedUrl && !entry.error) facePhotoUrls[entry.path ?? ""] = entry.signedUrl;
      }
    }
  }

  // Carry the raw `created_at` alongside each formatted item so the merged
  // list can be sorted chronologically, then dropped — the UI only ever
  // sees the pre-formatted `submittedAt`.
  const bookingItems = bookingRows.map((b) => ({
    at: b.created_at,
    item: {
      kind: "booking",
      id: b.id,
      name: b.name,
      phone: b.phone,
      guestCount: b.guest_count,
      visitorType: b.visitor_type?.label_ku ?? "—",
      visitDate: formatVisitDate(b.visit_date),
      submittedAt: formatSubmittedAt(b.created_at),
      facePhotoUrl: b.face_image_path ? (facePhotoUrls[b.face_image_path] ?? null) : null,
      href: `/admin/bookings?view=${b.id}`,
    } satisfies AdminNotificationItem,
  }));

  const messageItems = (messagesRes.data ?? []).map((m) => ({
    at: m.created_at,
    item: {
      kind: "message",
      id: m.id,
      name: m.name,
      phone: m.phone,
      preview: messageSnippet(m.message),
      submittedAt: formatSubmittedAt(m.created_at),
      href: `/admin/messages?open=${m.id}`,
    } satisfies AdminNotificationItem,
  }));

  const items = [...bookingItems, ...messageItems]
    .sort((a, b) => b.at.localeCompare(a.at))
    .slice(0, LIST_LIMIT)
    .map(({ item }) => item);

  const pendingBookings = bookingsRes.count ?? bookingItems.length;
  const unreadMessages = messagesRes.count ?? messageItems.length;

  return {
    total: pendingBookings + unreadMessages,
    pendingBookings,
    unreadMessages,
    items,
  };
}
