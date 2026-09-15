import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/adminAuth";
import { AdminShell } from "../_components/AdminShell";
import { getAdminNotifications } from "./getAdminNotifications";

// Defense in depth: proxy.ts already guards /admin with a cheap signature-
// only check, but every protected server render re-fetches the session
// (including its current role/permissions) directly rather than trusting
// it was already verified upstream.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getAdminSession();

  if (!session) {
    redirect("/admin/login");
  }

  const notifications = await getAdminNotifications();

  return (
    <AdminShell
      unreadMessages={notifications.unreadMessages}
      pendingBookings={notifications.pendingBookings}
      notifications={notifications}
      permissions={session.role.permissions}
    >
      {children}
    </AdminShell>
  );
}
