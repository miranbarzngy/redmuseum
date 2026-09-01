"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
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
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { NativePushBridge } from "./NativePushBridge";
import { ToastProvider, FlashToast } from "./Toast";

// `shortLabel` is the compact form for the phone bottom bar, where a
// two-word label like «بەشەکانی مۆزەخانە» wraps to two lines and breaks the
// row's alignment. The sidebar and «زیاتر» sheet always use the full `label`.
type NavItem = { href: string; label: string; shortLabel?: string; icon: LucideIcon };

const NAV_GROUPS: { label?: string; items: NavItem[] }[] = [
  { items: [{ href: "/admin", label: "گشتی", icon: LayoutDashboard }] },
  {
    label: "ناوەڕۆکی ماڵپەڕ",
    items: [
      { href: "/admin/profile", label: "پرۆفایل", icon: UserRound },
      { href: "/admin/museums", label: "بەشەکانی مۆزەخانە", shortLabel: "بەشەکان", icon: BookOpen },
      { href: "/admin/museumhistory", label: "مێژووی مۆزەخانە", icon: CalendarClock },
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

// Layout split between the desktop sidebar and the phone-style bottom bar:
//
//  - In a browser, the sidebar only takes over at `lg` (1024px) and up, so
//    phones and portrait tablets / iPads keep the bottom bar.
//  - Inside the installed native APK (`useIsNativeApp`) the bottom bar is
//    forced at every width — an Android tablet's WebView reports a
//    desktop-width viewport, so a CSS breakpoint alone would wrongly give it
//    the sidebar.
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
  // When true, the phone-style bottom nav is used at every width and the
  // sidebar is never rendered (see the layout note above the component).
  const forceBottomNav = useIsNativeApp();

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
      <div
        dir="rtl"
        className={clsx("min-h-screen bg-canvas text-ink", !forceBottomNav && "lg:pr-64")}
      >
        <NativePushBridge />
        <Suspense fallback={null}>
          <FlashToast />
        </Suspense>

        {/* Desktop sidebar (browser, ≥ lg) — this shell is permanently RTL, so
            physical right-0 / border-l are used directly rather than logical
            props. Never rendered inside the native APK. */}
        <aside
          className={clsx(
            "fixed inset-y-0 right-0 z-40 hidden w-64 flex-col border-l border-ink/10 bg-white",
            !forceBottomNav && "lg:flex",
          )}
        >
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
            <span
              className={clsx(
                "font-kurdish text-fluid-base font-semibold text-ink",
                !forceBottomNav && "lg:hidden",
              )}
            >
              {currentLabel}
            </span>
            <span
              className={clsx(
                "font-kurdish hidden text-fluid-lg font-semibold text-ink",
                !forceBottomNav && "lg:block",
              )}
            >
              {currentLabel}
            </span>
          </div>
        </header>

        {/* Phone / tablet bottom nav: 5 primary + More. Every item keeps a
            persistent label (no layout-shifting reveal); the active one gets
            a single soft brand-red pill behind the icon plus a red label,
            matching the sidebar / «زیاتر» sheet. Pure CSS transitions so it
            behaves identically in the Capacitor APK build. Shown at every
            width in the native APK, and below `lg` in a browser — the row is
            capped and centred so it stays a "bar" on a wide tablet. */}
        <nav
          className={clsx(
            "fixed inset-x-0 bottom-0 z-40 border-t border-ink/10 bg-white/95 backdrop-blur-md",
            "shadow-[0_-10px_30px_-18px_rgba(28,27,25,0.25)]",
            !forceBottomNav && "lg:hidden",
          )}
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        >
          <ul className="mx-auto flex max-w-md items-stretch">
            {mobileBar.map((item) => (
              <li key={item.href} className="flex-1">
                <BottomNavItem
                  label={item.shortLabel ?? item.label}
                  ariaLabel={item.label}
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
            className={clsx(
              "fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm",
              !forceBottomNav && "lg:hidden",
            )}
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

        <main
          className={clsx(
            "mx-auto max-w-5xl px-5 py-8 pb-28 sm:px-8 sm:py-10",
            !forceBottomNav && "lg:pb-12",
          )}
        >
          {children}
        </main>
      </div>
    </ToastProvider>
  );
}

function BottomNavItem({
  label,
  ariaLabel,
  icon: Icon,
  href,
  active,
  badge,
  onClick,
}: {
  label: string;
  /** Full accessible name when `label` is an abbreviated form. Defaults to `label`. */
  ariaLabel?: string;
  icon: LucideIcon;
  href?: string;
  active: boolean;
  badge?: { count: number; tone: string } | null;
  onClick?: () => void;
}) {
  const inner = (
    <>
      {/* icon in a pill that fills with soft brand red and lifts when active */}
      <span
        className={clsx(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-out",
          active
            ? "-translate-y-0.5 bg-[#850B10]/12 text-[#850B10]"
            : "translate-y-0 text-ink-faint group-hover:bg-canvas-paper group-hover:text-ink-soft",
        )}
      >
        <Icon
          size={19}
          strokeWidth={active ? 2.4 : 2}
          className="transition-transform duration-200 group-active:scale-90"
        />
        {badge && badge.count > 0 && (
          <span
            className={clsx(
              "absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none text-canvas ring-2 ring-white",
              badge.tone,
            )}
          >
            {badge.count > 9 ? "9+" : badge.count}
          </span>
        )}
      </span>
      {/* persistent label — only the colour changes on active */}
      <span
        className={clsx(
          "font-kurdish whitespace-nowrap text-[10px] leading-none transition-colors duration-200",
          active ? "font-semibold text-[#850B10]" : "font-medium text-ink-faint",
        )}
      >
        {label}
      </span>
    </>
  );

  const className =
    "group relative flex w-full flex-col items-center justify-center gap-1 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#850B10]/25";

  return href ? (
    <Link
      href={href}
      aria-label={ariaLabel ?? label}
      aria-current={active ? "page" : undefined}
      className={className}
    >
      {inner}
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={className}>
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
