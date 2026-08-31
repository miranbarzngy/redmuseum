"use client";

import { Suspense, useState } from "react";
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
  Ticket,
  Settings,
  MoreHorizontal,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "../actions";
import { NativePushBridge } from "./NativePushBridge";
import { ToastProvider, FlashToast } from "./Toast";

type NavItem = { href: string; label: string; icon: LucideIcon };

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: "/admin", label: "گشتی", icon: LayoutDashboard }] },
  {
    label: "ناوەڕۆکی ماڵپەڕ",
    items: [
      { href: "/admin/profile", label: "پرۆفایل", icon: UserRound },
      { href: "/admin/museums", label: "بەشەکانی مۆزەخانە", icon: BookOpen },
      { href: "/admin/exhibitions", label: "پێشانگاکان", icon: CalendarClock },
      { href: "/admin/gallery", label: "گەلەری", icon: Images },
    ],
  },
  {
    label: "داواکارییەکان",
    items: [
      { href: "/admin/bookings", label: "سەردانەکان", icon: Ticket },
      { href: "/admin/messages", label: "پەیامەکان", icon: Inbox },
    ],
  },
];

const SETTINGS_ITEM: NavItem = { href: "/admin/settings", label: "ڕێکخستنەکان", icon: Settings };
const ALL_ITEMS: NavItem[] = [...NAV_GROUPS.flatMap((g) => g.items), SETTINGS_ITEM];

// Five items get a permanent slot in the phone bottom bar; everything else
// lives behind the «زیاتر» sheet.
const MOBILE_PRIMARY = new Set([
  "/admin",
  "/admin/museums",
  "/admin/gallery",
  "/admin/bookings",
  "/admin/messages",
]);

// The sidebar/bottom-nav split uses `md` (768px) rather than `lg` so an
// iPad in portrait already gets the sidebar instead of the phone bottom bar.
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
  const [sheetOpen, setSheetOpen] = useState(false);

  function isActive(href: string) {
    return href === "/admin" ? pathname === "/admin" : pathname.startsWith(href);
  }

  const currentLabel = ALL_ITEMS.find((n) => isActive(n.href))?.label ?? "بەڕێوەبردن";

  function badgeFor(href: string) {
    if (href === "/admin/messages" && unreadMessages > 0)
      return { count: unreadMessages, tone: "bg-pigment-crimson" };
    if (href === "/admin/bookings" && pendingBookings > 0)
      return { count: pendingBookings, tone: "bg-pigment-gold" };
    return null;
  }

  const mobileBar = ALL_ITEMS.filter((n) => MOBILE_PRIMARY.has(n.href));
  const sheetItems = ALL_ITEMS.filter((n) => !MOBILE_PRIMARY.has(n.href));
  const moreActive = sheetItems.some((n) => isActive(n.href));

  return (
    <ToastProvider>
      <div dir="rtl" className="min-h-screen bg-canvas text-ink md:pr-64">
        <NativePushBridge />
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>

        {/* Desktop / iPad sidebar — this shell is permanently RTL, so physical
            right-0 / border-l are used directly rather than logical props. */}
        <aside className="fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-ink/10 bg-white md:flex">
          <div className="border-b border-ink/10 px-5 py-5">
            <span className="font-kurdish text-fluid-base font-semibold text-ink">ئەمنە سورەکە</span>
            <p className="font-kurdish mt-0.5 text-fluid-xs text-ink-faint">بەڕێوەبردن</p>
          </div>

          <nav className="flex flex-1 flex-col gap-4 overflow-y-auto px-3 py-4">
            {NAV_GROUPS.map((group, gi) => (
              <div key={group.label ?? gi} className="flex flex-col gap-1">
                {group.label && (
                  <p className="font-kurdish px-3.5 pb-1 text-[11px] font-medium text-ink-faint">
                    {group.label}
                  </p>
                )}
                {group.items.map((item) => (
                  <SidebarLink key={item.href} item={item} active={isActive(item.href)} badge={badgeFor(item.href)} />
                ))}
              </div>
            ))}
          </nav>

          <div className="flex flex-col gap-1 border-t border-ink/10 p-3">
            <SidebarLink item={SETTINGS_ITEM} active={isActive(SETTINGS_ITEM.href)} badge={null} />
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
              {currentLabel}
            </span>
            <span className="font-kurdish hidden text-fluid-lg font-semibold text-ink md:block">
              {currentLabel}
            </span>
          </div>
        </header>

        {/* Mobile / tablet bottom nav: 5 primary + More, with per-item
            animation (icon lift + fading pill + sliding top indicator +
            label reveal). Pure CSS transitions so it behaves identically in
            the Capacitor APK build. */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur-md md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="flex items-stretch">
            {mobileBar.map((item) => (
              <li key={item.href} className="flex-1">
                <BottomNavItem
                  label={item.label}
                  icon={item.icon}
                  href={item.href}
                  active={isActive(item.href)}
                  badge={badgeFor(item.href)}
                />
              </li>
            ))}
            <li className="flex-1">
              <BottomNavItem
                label="زیاتر"
                icon={MoreHorizontal}
                active={moreActive || sheetOpen}
                onClick={() => setSheetOpen(true)}
              />
            </li>
          </ul>
        </nav>

        {/* Mobile "More" sheet */}
        {sheetOpen && (
          <div
            className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm md:hidden"
            onClick={() => setSheetOpen(false)}
          >
            <div
              className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-ink/10 bg-white p-4"
              style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 flex items-center justify-between">
                <span className="font-kurdish text-fluid-sm font-semibold text-ink">هەموو بەشەکان</span>
                <button
                  type="button"
                  onClick={() => setSheetOpen(false)}
                  aria-label="داخستن"
                  className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-canvas-paper hover:text-ink"
                >
                  <X size={16} />
                </button>
              </div>
              <div className="flex flex-col gap-1">
                {sheetItems.map(({ href, label, icon: Icon }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setSheetOpen(false)}
                    className={`font-kurdish flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-fluid-sm font-medium transition-colors ${
                      isActive(href) ? "bg-[#850B10] text-canvas" : "text-ink-soft hover:bg-canvas-paper hover:text-ink"
                    }`}
                  >
                    <Icon size={16} /> {label}
                  </Link>
                ))}
                <Link
                  href="/"
                  target="_blank"
                  onClick={() => setSheetOpen(false)}
                  className="font-kurdish flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:bg-canvas-paper hover:text-ink"
                >
                  <ExternalLink size={15} /> بینینی ماڵپەڕ
                </Link>
                <form action={signOut}>
                  <button
                    type="submit"
                    className="font-kurdish flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:bg-pigment-crimson/10 hover:text-pigment-crimson"
                  >
                    <LogOut size={15} /> چوونەدەرەوە
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <main className="mx-auto max-w-5xl px-5 py-8 pb-28 sm:px-8 sm:py-10 md:pb-12">{children}</main>
      </div>
    </ToastProvider>
  );
}

function BottomNavItem({
  label,
  icon: Icon,
  href,
  active,
  badge,
  onClick,
}: {
  label: string;
  icon: LucideIcon;
  href?: string;
  active: boolean;
  badge?: { count: number; tone: string } | null;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {/* sliding top indicator */}
      <span
        className={`absolute top-0 h-0.5 rounded-full bg-pigment-terracotta transition-all duration-300 ease-out ${
          active ? "w-7 opacity-100" : "w-0 opacity-0"
        }`}
      />
      {/* icon + fading pill; lifts on active */}
      <span
        className={`relative flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 ease-out ${
          active
            ? "-translate-y-0.5 bg-pigment-terracotta/12 text-pigment-terracotta"
            : "translate-y-0 text-ink-faint group-hover:text-ink-soft"
        }`}
      >
        <Icon size={18} className="transition-transform duration-200 group-active:scale-90" />
        {badge && badge.count > 0 && (
          <span
            className={`absolute -top-0.5 right-0.5 h-2 w-2 rounded-full ring-2 ring-white ${badge.tone}`}
          />
        )}
      </span>
      {/* label reveal */}
      <span
        className={`font-kurdish overflow-hidden text-[10px] font-medium leading-none transition-all duration-300 ease-out ${
          active ? "max-h-4 opacity-100 text-pigment-terracotta" : "max-h-0 opacity-0 text-ink-faint"
        }`}
      >
        {label}
      </span>
    </>
  );

  const className =
    "group relative flex w-full flex-col items-center justify-center gap-1 py-2 outline-none";

  return href ? (
    <Link href={href} aria-label={label} aria-current={active ? "page" : undefined} className={className}>
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={label} className={className}>
      {inner}
    </button>
  );
}

function SidebarLink({
  item,
  active,
  badge,
}: {
  item: NavItem;
  active: boolean;
  badge: { count: number; tone: string } | null;
}) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      className={`font-kurdish flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-fluid-sm font-medium transition-colors ${
        active ? "bg-[#850B10] text-canvas" : "text-ink-soft hover:bg-canvas-paper hover:text-ink"
      }`}
    >
      <Icon size={16} />
      {label}
      {badge && (
        <span
          className={`mr-auto flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold text-canvas ${badge.tone}`}
        >
          {badge.count}
        </span>
      )}
    </Link>
  );
}
