"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  CalendarClock,
  Images,
  LogOut,
  ExternalLink,
  UserRound,
  BookOpen,
  Inbox,
  Bell,
  Ticket,
  Settings,
} from "lucide-react";
import { signOut } from "../actions";
import { NativePushBridge } from "./NativePushBridge";

const NAV = [
  { href: "/admin", label: "گشتی", icon: LayoutDashboard },
  { href: "/admin/profile", label: "پرۆفایل", icon: UserRound },
  { href: "/admin/museums", label: "بەشەکانی مۆزەخانە", icon: BookOpen },
  { href: "/admin/exhibitions", label: "پێشانگاکان", icon: CalendarClock },
  { href: "/admin/gallery", label: "گەلەری", icon: Images },
  { href: "/admin/bookings", label: "سەردانەکان", icon: Ticket },
  { href: "/admin/messages", label: "پەیامەکان", icon: Inbox },
  { href: "/admin/settings", label: "ڕێکخستنەکان", icon: Settings },
];

// The sidebar/bottom-nav split uses `md` (768px) rather than `lg` so an
// iPad in portrait — grouped with "desktop" in the design brief — already
// gets the sidebar treatment instead of the phone-style bottom bar.
export function AdminShell({
  children,
  unreadMessages = 0,
  pendingBookings = 0,
}: {
  children: React.ReactNode;
  unreadMessages?: number;
  pendingBookings?: number;
}) {
  const pathname = usePathname();

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const currentLabel = NAV.find((n) => isActive(n.href))?.label ?? "بەڕێوەبردن";

  return (
    <div dir="rtl" className="min-h-screen bg-canvas text-ink md:pr-64">
      <NativePushBridge />

      {/* Desktop / iPad sidebar — this admin shell is permanently RTL (never
          toggles to LTR), so literal physical properties are used directly
          rather than logical start/end ones: right-0 docks it to the
          physical right edge, border-l puts the divider on the edge facing
          the content. */}
      <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-ink/10 bg-white md:flex">
        <div className="border-b border-ink/10 px-5 py-5">
          <span className="font-kurdish text-fluid-base font-semibold text-ink">ئەمنە سورەکە</span>
          <p className="font-kurdish mt-0.5 text-fluid-xs text-ink-faint">بەڕێوەبردن</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 py-4">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`font-kurdish flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-fluid-sm font-medium transition-colors ${
                  active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-canvas-paper hover:text-ink"
                }`}
              >
                <Icon size={16} />
                {label}
                {href === "/admin/messages" && unreadMessages > 0 && (
                  <span className="mr-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-pigment-crimson px-1 text-[10px] font-semibold text-canvas">
                    {unreadMessages}
                  </span>
                )}
                {href === "/admin/bookings" && pendingBookings > 0 && (
                  <span className="mr-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-pigment-gold px-1 text-[10px] font-semibold text-canvas">
                    {pendingBookings}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex flex-col gap-1 border-t border-ink/10 p-3">
          <Link
            href="/"
            target="_blank"
            className="font-kurdish flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:bg-canvas-paper hover:text-ink"
          >
            <ExternalLink size={15} /> بینینی ماڵپەڕ
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="font-kurdish flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:bg-pigment-crimson/10 hover:text-pigment-crimson"
            >
              <LogOut size={15} /> چوونەدەرەوە
            </button>
          </form>
        </div>
      </aside>

      {/* Top header */}
      <header className="sticky top-0 z-30 border-b border-ink/10 bg-white/90 backdrop-blur-md">
        <div className="flex items-center justify-between gap-3 px-5 py-4 sm:px-8">
          <span className="font-kurdish text-fluid-base font-semibold text-ink md:hidden">
            ئەمنە سورەکە — بەڕێوەبردن
          </span>
          <span className="font-kurdish hidden text-fluid-lg font-semibold text-ink md:block">
            {currentLabel}
          </span>

          <div className="flex items-center gap-3">
            <Link
              href="/admin/messages"
              aria-label="پەیامەکان"
              className="relative flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-soft transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
            >
              <Bell size={16} />
              {unreadMessages > 0 && (
                <span className="absolute -left-0.5 -top-0.5 h-2.5 w-2.5 animate-pulse rounded-full bg-pigment-crimson ring-2 ring-white" />
              )}
            </Link>

            <Link
              href="/"
              target="_blank"
              className="font-kurdish inline-flex items-center gap-1.5 text-fluid-xs font-medium text-ink-soft hover:text-pigment-terracotta md:hidden"
            >
              بینینی ماڵپەڕ <ExternalLink size={13} />
            </Link>

            <form action={signOut} className="md:hidden">
              <button
                type="submit"
                className="font-kurdish inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3.5 py-1.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:border-pigment-crimson hover:text-pigment-crimson"
              >
                <LogOut size={13} /> چوونەدەرەوە
              </button>
            </form>
          </div>
        </div>
      </header>

      {/* Mobile bottom nav */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex items-stretch justify-around border-t border-ink/10 bg-white/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              className={`relative flex flex-1 flex-col items-center justify-center gap-1 py-2.5 text-[10px] font-medium transition-colors ${
                active ? "text-pigment-terracotta" : "text-ink-faint"
              }`}
            >
              <Icon size={18} />
              {href === "/admin/messages" && unreadMessages > 0 && (
                <span className="absolute left-1/2 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-pigment-crimson" />
              )}
              {href === "/admin/bookings" && pendingBookings > 0 && (
                <span className="absolute left-1/2 top-1.5 h-2 w-2 -translate-x-1/2 rounded-full bg-pigment-gold" />
              )}
            </Link>
          );
        })}
      </nav>

      <main className="mx-auto max-w-6xl px-5 py-8 pb-24 sm:px-8 sm:py-10 md:pb-10">{children}</main>
    </div>
  );
}
