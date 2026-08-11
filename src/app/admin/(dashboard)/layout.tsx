import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ADMIN_COOKIE_NAME, isValidSessionCookie } from "@/lib/adminAuth";
import { AdminShell } from "../_components/AdminShell";
import { getUnreadMessageCount } from "./messages/actions";
import { getPendingBookingCount } from "./bookings/actions";

// Defense in depth: middleware already guards /admin, but every protected
// server render re-checks the session directly rather than trusting it was
// already verified upstream.
export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const authed = await isValidSessionCookie((await cookies()).get(ADMIN_COOKIE_NAME)?.value);

  if (!authed) {
    redirect("/admin/login");
  }

  const unreadMessages = await getUnreadMessageCount();
  const pendingBookings = await getPendingBookingCount();

  return (
    <AdminShell unreadMessages={unreadMessages} pendingBookings={pendingBookings}>
      {children}
    </AdminShell>
  );
}
