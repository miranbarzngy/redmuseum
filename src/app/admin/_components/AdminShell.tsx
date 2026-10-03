"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link, { useLinkStatus } from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { LogOut, ExternalLink, MoreHorizontal, ArrowRight, Search } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { signOut } from "../actions";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { NativePushBridge, PUSH_TOKEN_KEY } from "./NativePushBridge";
import { NavigationProgress } from "./NavigationProgress";
import { NotificationsBell } from "./NotificationsBell";
import { ToastProvider, FlashToast } from "./Toast";
import { EMPTY_ADMIN_NOTIFICATIONS, type AdminNotifications } from "./adminNotificationsShape";
import { MOBILE_PRIMARY, QUICK_ACTIONS, SETTINGS_ITEM, canSee, isActiveHref, visibleNav, type NavItem } from "./adminNav";
import { PageChromeProvider, usePageChrome } from "./pageChrome";
import { Sheet } from "./Sheet";
import { PullToRefresh } from "./PullToRefresh";
import { CommandPalette, usePaletteShortcut } from "./CommandPalette";
import { slidingIndicatorMotion, useSlidingIndicator } from "./useSlidingIndicator";

const LOGO_SRC = "/images/logo/android-chrome-192x192.png";

/** Action for both sign-out buttons: passes signOut() this phone's push token
 * (only ever stored inside the native app) so the phone is unregistered along
 * with the session. */
function signOutThisDevice(formData: FormData) {
  try {
    const pushToken = localStorage.getItem(PUSH_TOKEN_KEY);
    if (pushToken) formData.set("push_token", pushToken);
  } catch {}
  return signOut(formData);
}

type Badge = { count: number; tone: string } | null;
type ShellUser = { name: string; role: string };

// Layout split between the desktop sidebar and the phone-style bottom bar:
//
//  - In a browser, the sidebar only takes over at `lg` (1024px) and up, so
//    phones and portrait tablets / iPads keep the bottom bar.
//  - Inside the installed native APK (`useIsNativeApp`) the bottom bar is
//    forced at every width — an Android tablet's WebView reports a
//    desktop-width viewport, so a CSS breakpoint alone would wrongly give it
//    the sidebar.
export function AdminShell(props: {
  children: React.ReactNode;
  unreadMessages?: number;
  pendingBookings?: number;
  notifications?: AdminNotifications;
  permissions?: string[];
  user: ShellUser;
}) {
  return (
    <ToastProvider>
      <PageChromeProvider>
        <ShellFrame {...props} />
      </PageChromeProvider>
    </ToastProvider>
  );
}

function ShellFrame({
  children,
  unreadMessages = 0,
  pendingBookings = 0,
  notifications = EMPTY_ADMIN_NOTIFICATIONS,
  permissions = [],
  user,
}: {
  children: React.ReactNode;
  unreadMessages?: number;
  pendingBookings?: number;
  notifications?: AdminNotifications;
  permissions?: string[];
  user: ShellUser;
}) {
  const pathname = usePathname();
  const chrome = usePageChrome();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  // When true, the phone-style bottom nav is used at every width and the
  // sidebar is never rendered (see the layout note above the component).
  const forceBottomNav = useIsNativeApp();

  const { groups: visibleGroups, showSettings, items: visibleItems } = visibleNav(permissions);
  const quickActions = QUICK_ACTIONS.filter((a) => canSee(permissions, a));
  const isActive = (href: string) => isActiveHref(pathname, href);
  const currentLabel = visibleItems.find((n) => isActive(n.href))?.label ?? "بەڕێوەبردن";

  // Unread messages: brand red. Pending bookings: warm gold, with dark text
  // — white on gold is only ~2:1.
  function badgeFor(href: string): Badge {
    if (href === "/admin/messages" && unreadMessages > 0)
      return { count: unreadMessages, tone: "bg-brand-fill text-white" };
    if (href === "/admin/bookings" && pendingBookings > 0)
      return { count: pendingBookings, tone: "bg-gold-fill text-[#3B2A00]" };
    return null;
  }

  const mobileBar = visibleItems.filter((n) => MOBILE_PRIMARY.has(n.href));
  const sheetItems = visibleItems.filter((n) => !MOBILE_PRIMARY.has(n.href));
  const moreActive = sheetItems.some((n) => isActive(n.href));
  // The dock's active pill slides between its tabs (none active → it fades).
  const { containerRef: dockRef, indicatorRef: dockPillRef } = useSlidingIndicator<
    HTMLUListElement,
    HTMLSpanElement
  >(mobileBar.find((n) => isActive(n.href))?.href ?? null);

  const openPalette = useCallback(() => setPaletteOpen(true), []);
  usePaletteShortcut(openPalette);

  // The top bar is flat and blends into the page at the top, and picks up
  // its hairline + blur only once content scrolls under it — like a native
  // app bar.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Phone top bar: until the page's large title scrolls under the bar, the
  // bar shows only the brand (or just the back button on a sub-page); after
  // that it takes over the title. A page without a large title (e.g. while
  // its loading skeleton shows) gets the section name straight away.
  const compactTitle = chrome.title ?? currentLabel;
  const showCompactTitle = chrome.titleScrolledAway || chrome.title === null;

  return (
    <div dir="rtl" className={clsx("isolate min-h-screen bg-canvas text-ink", !forceBottomNav && "lg:pr-64")}>
      {/* Soft oxblood / gold glow behind everything instead of a flat
          backdrop. Fixed, so long pages don't stretch it; the glass bars
          and sidebar pick its tint up through their blur. */}
      <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 bg-admin-mesh" />
      <NativePushBridge />
      <Suspense fallback={null}>
        <FlashToast />
        <NavigationProgress />
      </Suspense>

      {/* Desktop sidebar (browser, ≥ lg) — this shell is permanently RTL, so
          physical right-0 / border-l are used directly rather than logical
          props. Never rendered inside the native APK. */}
      <aside
        className={clsx(
          "fixed inset-y-0 right-0 z-40 hidden w-64 select-none flex-col border-l border-ink/[0.07] bg-white/70 backdrop-blur-xl backdrop-saturate-150",
          !forceBottomNav && "lg:flex",
        )}
      >
        <div className="flex items-center gap-3 border-b border-ink/[0.07] px-5 py-3.5">
          <BrandMark className="h-10 w-10" />
          <div className="min-w-0">
            <span className="font-kurdish block text-fluid-base font-semibold text-ink">ئەمنە سورەکە</span>
            <p className="font-kurdish mt-0.5 text-fluid-xs text-ink-faint">بەڕێوەبردن</p>
          </div>
        </div>

        <div className="px-3 pt-3">
          <button
            type="button"
            onClick={openPalette}
            className="font-kurdish flex w-full items-center gap-2.5 rounded-xl border border-ink/10 bg-canvas px-3 py-2 text-fluid-xs text-ink-faint transition-colors hover:border-ink/20 hover:text-ink-soft"
          >
            <Search size={15} />
            <span className="flex-1 text-start">گەڕانی خێرا…</span>
            <kbd dir="ltr" className="rounded-md border border-ink/15 bg-white px-1.5 py-0.5 font-sans text-[10px]">
              Ctrl K
            </kbd>
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-3 overflow-y-auto px-3 py-3">
          {visibleGroups.map((group, gi) => (
            <div key={group.label ?? gi} className="flex flex-col gap-0.5">
              {group.label && (
                <p className="font-kurdish px-3.5 pb-1 text-[11px] font-medium text-ink-faint">{group.label}</p>
              )}
              {group.items.map((item) => (
                <SidebarLink key={item.href} item={item} active={isActive(item.href)} badge={badgeFor(item.href)} />
              ))}
            </div>
          ))}
        </nav>

        <div className="flex flex-col gap-0.5 border-t border-ink/[0.07] p-3">
          {showSettings && <SidebarLink item={SETTINGS_ITEM} active={isActive(SETTINGS_ITEM.href)} badge={null} />}
          <Link
            href="/"
            target="_blank"
            className="font-kurdish flex items-center gap-3 rounded-xl px-3.5 py-2 text-fluid-xs font-medium text-ink-soft transition-colors hover:bg-canvas-paper hover:text-ink"
          >
            <ExternalLink size={15} /> بینینی ماڵپەڕ
          </Link>
          <UserRow user={user} withSignOut className="mt-1 px-2 py-1.5" />
        </div>
      </aside>

      {/* Top app bar. Transparent over the backdrop at the top of the page,
          frosted glass with a hairline once content scrolls under it.
          Padded for the status bar / notch (env() is 0 wherever there
          isn't one). */}
      <header
        className={clsx(
          "sticky top-0 z-30 select-none pt-[env(safe-area-inset-top)] transition-[background-color,border-color,box-shadow] duration-200",
          scrolled
            ? "border-b border-ink/[0.07] bg-canvas/70 backdrop-blur-xl backdrop-saturate-150"
            : "border-b border-transparent bg-transparent",
        )}
      >
        <div className="flex h-14 items-center justify-between gap-2 px-3 sm:px-6 lg:h-16">
          {/* Phone / native: back button or brand, then the collapsing title. */}
          <div className={clsx("flex min-w-0 flex-1 items-center gap-1", !forceBottomNav && "lg:hidden")}>
            {chrome.backHref ? (
              <Link
                href={chrome.backHref}
                aria-label="گەڕانەوە"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink transition-transform hover:bg-canvas-paper active:scale-90"
              >
                <ArrowRight size={21} />
              </Link>
            ) : (
              <span className="flex shrink-0 items-center px-1.5">
                <BrandMark className="h-8 w-8" />
              </span>
            )}
            <div className="relative h-7 min-w-0 flex-1">
              {!chrome.backHref && (
                <span
                  aria-hidden={showCompactTitle}
                  className={clsx(
                    "font-kurdish absolute inset-0 flex items-center truncate text-fluid-base font-semibold text-ink transition-all duration-200",
                    showCompactTitle ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100",
                  )}
                >
                  ئەمنە سورەکە
                </span>
              )}
              <span
                aria-hidden={!showCompactTitle}
                className={clsx(
                  "font-kurdish absolute inset-0 flex items-center text-fluid-base font-semibold text-ink transition-all duration-200",
                  showCompactTitle ? "translate-y-0 opacity-100" : "-translate-y-1 opacity-0",
                )}
              >
                <span className="truncate">{compactTitle}</span>
              </span>
            </div>
          </div>

          {/* Desktop sidebar layout: the section title, always shown. */}
          <span
            className={clsx(
              "font-kurdish hidden truncate text-fluid-lg font-semibold text-ink",
              !forceBottomNav && "lg:block",
            )}
          >
            {currentLabel}
          </span>

          <div className="flex shrink-0 items-center gap-0.5">
            <button
              type="button"
              onClick={openPalette}
              aria-label="گەڕانی خێرا"
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-full text-ink-faint transition-[colors,transform] hover:bg-canvas-paper hover:text-ink-soft active:scale-90",
                !forceBottomNav && "lg:hidden",
              )}
            >
              <Search className="h-[19px] w-[19px]" />
            </button>
            <NotificationsBell notifications={notifications} />
          </div>
        </div>
      </header>

      <PullToRefresh />

      {/* Phone / tablet bottom nav: 5 primary + More (the notification bell
          lives in the header, not here). Every item keeps a persistent label
          (no layout-shifting reveal); the active one gets a single soft
          brand-red pill behind the icon plus a red label, matching the
          sidebar / «زیاتر» sheet. Shown at every width in the native APK,
          and below `lg` in a browser — the row is capped and centred so it
          stays a "bar" on a wide tablet. The bar floats — a rounded capsule
          inset from the screen edges and lifted clear of the home
          indicator, rather than a flush-to-edge strip. */}
      <nav
        className={clsx(
          "fixed inset-x-0 bottom-0 z-40 flex select-none justify-center px-4",
          !forceBottomNav && "lg:hidden",
        )}
        style={{ paddingBottom: "calc(env(safe-area-inset-bottom) + 1.5rem)" }}
      >
        <ul
          ref={dockRef}
          className="group/pill relative mx-auto flex w-full max-w-xl items-stretch rounded-full border border-white/70 bg-white/75 px-2 shadow-dock ring-1 ring-ink/[0.05] backdrop-blur-xl backdrop-saturate-150"
        >
          <span
            ref={dockPillRef}
            aria-hidden
            className={clsx(
              "pointer-events-none absolute left-0 top-0 rounded-full bg-gradient-to-b from-brand/[0.16] to-brand/[0.07] opacity-0 ring-1 ring-inset ring-brand/10",
              slidingIndicatorMotion,
            )}
          />
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

      {/* «زیاتر» — every section that isn't in the bar, as a native bottom
          sheet of app-style tiles. Swipe it down or tap outside to close. */}
      <Sheet open={sheetOpen} onClose={() => setSheetOpen(false)} label="هەموو بەشەکان" desktop="sheet" widthClassName="max-w-xl">
        <div className="min-h-0 overflow-y-auto overscroll-contain px-4 pb-4">
          <UserRow user={user} className="mb-3 bg-canvas-paper/70" />

          {sheetItems.length > 0 && (
            <div className="grid grid-cols-3 gap-2.5">
              {sheetItems.map((item) => (
                <SheetTile
                  key={item.href}
                  item={item}
                  active={isActive(item.href)}
                  badge={badgeFor(item.href)}
                  onNavigate={() => setSheetOpen(false)}
                />
              ))}
            </div>
          )}

          <div className="mt-3 flex flex-col overflow-hidden rounded-2xl bg-canvas-paper/70">
            <Link
              href="/"
              target="_blank"
              onClick={() => setSheetOpen(false)}
              className="font-kurdish flex items-center gap-3 px-4 py-3.5 text-fluid-sm font-medium text-ink-soft transition-colors active:bg-ink/5"
            >
              <ExternalLink size={17} /> بینینی ماڵپەڕ
            </Link>
            <form action={signOutThisDevice} className="border-t border-ink/10">
              <button
                type="submit"
                className="font-kurdish flex w-full items-center gap-3 px-4 py-3.5 text-fluid-sm font-medium text-pigment-crimson transition-colors active:bg-pigment-crimson/10"
              >
                <LogOut size={17} /> چوونەدەرەوە
              </button>
            </form>
          </div>
        </div>
      </Sheet>

      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        sections={visibleItems}
        actions={quickActions}
      />

      <main
        id="admin-main"
        className={clsx(
          "mx-auto max-w-5xl px-4 pb-[calc(env(safe-area-inset-bottom)+7.5rem)] pt-3 sm:px-8 sm:pt-6",
          !forceBottomNav && "lg:pb-12 lg:pt-8",
        )}
      >
        {children}
      </main>
    </div>
  );
}

function BrandMark({ className }: { className?: string }) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={LOGO_SRC} alt="" width={40} height={40} className={clsx("shrink-0 rounded-xl object-contain", className)} />
  );
}

function UserRow({ user, withSignOut, className }: { user: ShellUser; withSignOut?: boolean; className?: string }) {
  const initial = user.name.trim().charAt(0) || "؟";
  return (
    <div className={clsx("flex items-center gap-3 rounded-2xl px-3 py-2.5", className)}>
      <span className="font-kurdish flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#850B10] text-fluid-sm font-semibold text-white">
        {initial}
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-kurdish truncate text-fluid-sm font-medium text-ink">{user.name}</p>
        <p className="font-kurdish truncate text-[11px] text-ink-faint">{user.role}</p>
      </div>
      {withSignOut && (
        <form action={signOutThisDevice}>
          <button
            type="submit"
            aria-label="چوونەدەرەوە"
            title="چوونەدەرەوە"
            className="flex h-9 w-9 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-pigment-crimson/10 hover:text-pigment-crimson active:scale-90"
          >
            <LogOut size={16} />
          </button>
        </form>
      )}
    </div>
  );
}

function CountBadge({ badge, className }: { badge: Badge; className?: string }) {
  if (!badge || badge.count <= 0) return null;
  return (
    <span
      className={clsx(
        "flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[9px] font-bold leading-none tabular-nums shadow-[0_1px_2px_rgba(28,27,25,0.25)] ring-2 ring-white",
        badge.tone,
        className,
      )}
    >
      {badge.count > 9 ? "9+" : badge.count}
    </span>
  );
}

function BottomNavItem({
  label,
  ariaLabel,
  icon,
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
  badge?: Badge;
  onClick?: () => void;
}) {
  const className =
    "group relative flex w-full flex-col items-center justify-center gap-1 py-2.5 outline-none [-webkit-tap-highlight-color:transparent] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#850B10]/25 md:py-3";

  return href ? (
    <Link href={href} aria-label={ariaLabel ?? label} aria-current={active ? "page" : undefined} className={className}>
      <PendingAware>
        {(pending) => (
          <BottomNavFace label={label} icon={icon} active={active} pending={pending} badge={badge} slides />
        )}
      </PendingAware>
    </Link>
  ) : (
    <button type="button" onClick={onClick} aria-label={ariaLabel ?? label} className={className}>
      <BottomNavFace label={label} icon={icon} active={active} pending={false} badge={badge} slides={false} />
    </button>
  );
}

/** Reads its parent <Link>'s navigation status — the link counts as
 * "pending" between the tap and the new route committing. With every
 * route's loading.tsx prefetched that's usually instant; on a slow
 * connection it's what shows the tap registered. */
function PendingAware({ children }: { children: (pending: boolean) => React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <>{children(pending)}</>;
}

function BottomNavFace({
  label,
  icon: Icon,
  active,
  pending,
  badge,
  slides,
}: {
  label: string;
  icon: LucideIcon;
  active: boolean;
  pending: boolean;
  badge?: Badge;
  /** Highlighted by the dock's sliding pill (marks itself data-active for
   * it) rather than its own fill — every tab except «زیاتر». */
  slides: boolean;
}) {
  return (
    <>
      {/* icon well — the shared sliding pill sits behind the active one */}
      <span
        data-active={slides && active}
        className={clsx(
          "relative flex h-9 w-9 items-center justify-center rounded-full transition-colors duration-300 ease-out md:h-11 md:w-11",
          active
            ? clsx(
                "bg-brand/[0.12] text-brand",
                // the sliding pill takes over once placed (useSlidingIndicator)
                slides && "group-data-[pill=ready]/pill:bg-transparent",
              )
            : pending
              ? "animate-pulse bg-brand/10 text-brand"
              : "text-ink-faint group-hover:bg-ink/[0.04] group-hover:text-ink-soft",
        )}
      >
        <Icon
          strokeWidth={active ? 2.4 : 2}
          className="h-[19px] w-[19px] transition-transform duration-150 group-active:scale-[0.85] md:h-[22px] md:w-[22px]"
        />
        <CountBadge badge={badge ?? null} className="absolute -right-1.5 -top-1" />
      </span>
      {/* persistent label — only the colour changes on active */}
      <span
        className={clsx(
          "font-kurdish whitespace-nowrap text-[10px] leading-none transition-colors duration-200",
          active || pending ? "font-semibold text-brand" : "font-medium text-ink-faint",
        )}
      >
        {label}
      </span>
    </>
  );
}

function SheetTile({
  item,
  active,
  badge,
  onNavigate,
}: {
  item: NavItem;
  active: boolean;
  badge: Badge;
  onNavigate: () => void;
}) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      onClick={onNavigate}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "font-kurdish relative flex flex-col items-center gap-2 rounded-2xl px-2 py-4 text-center text-fluid-xs font-medium transition-[colors,transform] duration-200 ease-out active:scale-95",
        active ? "bg-brand-fill text-white shadow-brand" : "bg-canvas-paper/70 text-ink-soft",
      )}
    >
      <span
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-2xl",
          active ? "bg-white/15" : "bg-white text-brand shadow-ring",
        )}
      >
        <Icon size={20} />
      </span>
      <span className="leading-tight">{label}</span>
      <CountBadge badge={badge} className="absolute left-2 top-2" />
    </Link>
  );
}

function SidebarLink({ item, active, badge }: { item: NavItem; active: boolean; badge: Badge }) {
  const { href, label, icon: Icon } = item;
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={clsx(
        "font-kurdish flex items-center gap-3 rounded-xl px-3.5 py-2 text-fluid-sm font-medium transition-[color,background-color,transform] duration-150 active:scale-[0.98]",
        active ? "bg-brand-fill text-white shadow-brand" : "text-ink-soft hover:bg-ink/[0.04] hover:text-ink",
      )}
    >
      <Icon size={16} />
      <span className="flex-1">{label}</span>
      {/* gold pip marks the current section */}
      {active && !badge && <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-brand-gold" />}
      <PendingAware>
        {(pending) =>
          pending && !active ? (
            <span aria-hidden className="h-1.5 w-1.5 animate-pulse rounded-full bg-brand" />
          ) : null
        }
      </PendingAware>
      {badge && (
        <span
          className={clsx(
            "flex h-5 min-w-5 items-center justify-center rounded-full px-1 text-[10px] font-semibold tabular-nums",
            badge.tone,
          )}
        >
          {badge.count}
        </span>
      )}
    </Link>
  );
}
