"use client";

import { useMemo, useState, useTransition } from "react";
import Link from "next/link";
import clsx from "clsx";
import {
  X,
  Ticket,
  Inbox,
  Phone,
  Users,
  Tag,
  CalendarDays,
  CheckCheck,
  ArrowUpRight,
  Loader2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { AdminNotificationItem, AdminNotifications } from "./adminNotificationsShape";
import { markAllMessagesRead } from "../(dashboard)/messages/actions";
import { bookingInitials } from "../(dashboard)/bookings/BookingAvatar";
import { Sheet } from "./Sheet";

/**
 * Centered notification modal opened from the bell (NotificationsBell.tsx).
 * Bookings render amber/gold, messages render emerald — the two colors stay
 * consistent across the badge, the tab counts, and every card so the kind
 * is readable at a glance without leaning on the icon alone. Purely
 * presentational aside from local tab/pending state; all data comes from
 * getAdminNotifications() via the dashboard layout.
 *
 * Rendered through Sheet, which portals to document.body: the bell lives
 * inside AdminShell's blurred header, and a `backdrop-filter` ancestor would
 * otherwise become the containing block of the `fixed` overlay and shrink
 * the dialog to the header's box. On phones it opens as a bottom sheet.
 */

type TabKey = "all" | "booking" | "message";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "هەموو" },
  { key: "booking", label: "سەردانەکان" },
  { key: "message", label: "پەیامەکان" },
];

export function NotificationModal({
  open,
  onClose,
  notifications,
}: {
  open: boolean;
  onClose: () => void;
  notifications: AdminNotifications;
}) {
  const { total, pendingBookings, unreadMessages, items } = notifications;
  const [tab, setTab] = useState<TabKey>("all");
  const [isMarkingRead, startMarkingRead] = useTransition();

  const visibleItems = useMemo(
    () => (tab === "all" ? items : items.filter((item) => item.kind === tab)),
    [items, tab],
  );

  return (
    <Sheet
      open={open}
      onClose={onClose}
      label="ئاگادارییەکان"
      className="sm:max-h-[min(85vh,640px)]"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 pb-3 sm:py-4">
        <div className="flex flex-col gap-0.5">
          <span className="font-kurdish text-fluid-base font-semibold text-ink">ئاگادارییەکان</span>
          <span className="font-kurdish text-fluid-xs text-ink-faint">
            {total > 0 ? `${total} ئاگاداریی چاوەڕوان` : "هیچ ئاگادارییەکی چاوەڕوان نییە"}
          </span>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="داخستن"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink"
        >
          <X size={17} />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1.5 border-b border-ink/10 px-4 py-2.5">
        {TABS.map((t) => {
          const count = t.key === "all" ? total : t.key === "booking" ? pendingBookings : unreadMessages;
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => setTab(t.key)}
              className={clsx(
                "font-kurdish flex items-center gap-1.5 rounded-full px-3 py-1.5 text-fluid-xs font-medium transition-colors",
                active ? "bg-ink text-canvas" : "text-ink-soft hover:bg-canvas-paper",
              )}
            >
              {t.label}
              <span
                className={clsx(
                  "rounded-full px-1.5 py-px text-[10px] font-bold leading-none",
                  active ? "bg-white/25 text-canvas" : "bg-ink/[0.08] text-ink-faint",
                )}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* List */}
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto overscroll-contain p-4">
        {visibleItems.length === 0 ? (
          <p className="font-kurdish py-10 text-center text-fluid-sm text-ink-faint">
            هیچ ئاگادارییەک لێرە نییە.
          </p>
        ) : (
          visibleItems.map((item) => (
            <NotificationCard key={`${item.kind}-${item.id}`} item={item} onNavigate={onClose} />
          ))
        )}
      </div>

      {/* Footer */}
      {(pendingBookings > 0 || unreadMessages > 0) && (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-ink/10 bg-canvas-paper/70 px-4 py-3">
          <div>
            {unreadMessages > 0 && (
              <button
                type="button"
                disabled={isMarkingRead}
                onClick={() => startMarkingRead(async () => { await markAllMessagesRead(); })}
                className="font-kurdish flex items-center gap-1.5 rounded-full bg-white px-3 py-1.5 text-fluid-xs font-medium text-ink-soft shadow-ring transition-colors hover:text-ink disabled:opacity-60"
              >
                {isMarkingRead ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <CheckCheck size={13} />
                )}
                هەموو وەک خوێندراو دابنێ
              </button>
            )}
          </div>
          <div className="flex items-center gap-3">
            {pendingBookings > 0 && (
              <Link
                href="/admin/bookings"
                onClick={onClose}
                className="font-kurdish flex items-center gap-1 text-fluid-xs font-medium text-amber-700 hover:underline"
              >
                هەموو سەردانەکان <ArrowUpRight size={13} />
              </Link>
            )}
            {unreadMessages > 0 && (
              <Link
                href="/admin/messages"
                onClick={onClose}
                className="font-kurdish flex items-center gap-1 text-fluid-xs font-medium text-emerald-700 hover:underline"
              >
                هەموو پەیامەکان <ArrowUpRight size={13} />
              </Link>
            )}
          </div>
        </div>
      )}
    </Sheet>
  );
}

function NotificationCard({
  item,
  onNavigate,
}: {
  item: AdminNotificationItem;
  onNavigate: () => void;
}) {
  const isBooking = item.kind === "booking";

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      className={clsx(
        "group flex shrink-0 overflow-hidden rounded-2xl border bg-gradient-to-br shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]",
        isBooking
          ? "border-amber-500/25 from-amber-50 to-white"
          : "border-emerald-500/20 from-emerald-50 to-white",
      )}
    >
      {item.kind === "booking" && (
        <span className="w-16 shrink-0 self-stretch bg-white/70">
          {item.facePhotoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.facePhotoUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-fluid-base font-semibold text-ink-soft">
              {bookingInitials(item.name)}
            </span>
          )}
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-2.5 p-3.5">
        <div className="flex items-center justify-between gap-2">
          <span
            className={clsx(
              "font-kurdish inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10px] font-bold",
              isBooking ? "bg-amber-500/15 text-amber-700" : "bg-emerald-500/15 text-emerald-700",
            )}
          >
            {isBooking ? (
              <Ticket size={12} strokeWidth={2.5} aria-hidden />
            ) : (
              <Inbox size={12} strokeWidth={2.5} aria-hidden />
            )}
            {isBooking ? "سەردانی نوێ" : "پەیامی نوێ"}
          </span>
          <span dir="ltr" className="shrink-0 text-[11px] font-bold text-ink-soft">
            {item.submittedAt}
          </span>
        </div>

        <div className="flex items-center justify-between gap-3">
          <span className="font-kurdish truncate text-fluid-sm font-semibold text-ink">{item.name}</span>
          <span dir="ltr" className="flex shrink-0 items-center gap-1 text-[11px] font-bold text-ink-soft">
            <Phone size={11} className="text-ink-faint" aria-hidden />
            {item.phone}
          </span>
        </div>

        {item.kind === "booking" ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <Chip icon={Tag}>{item.visitorType}</Chip>
            <Chip icon={Users}>{item.guestCount} کەس</Chip>
            <Chip icon={CalendarDays} dir="ltr" bold>
              {item.visitDate}
            </Chip>
          </div>
        ) : (
          <p className="font-kurdish line-clamp-2 rounded-xl bg-white/70 px-2.5 py-2 text-fluid-xs text-ink-soft">
            {item.preview}
          </p>
        )}
      </div>
    </Link>
  );
}

function Chip({
  icon: Icon,
  dir,
  bold,
  children,
}: {
  icon: LucideIcon;
  dir?: "ltr";
  bold?: boolean;
  children: React.ReactNode;
}) {
  return (
    <span
      dir={dir}
      className={clsx(
        "inline-flex items-center gap-1 rounded-full border border-ink/10 bg-white/80 px-2 py-0.5 text-[10.5px] text-ink-soft",
        bold ? "font-bold" : "font-medium",
      )}
    >
      <Icon size={10} className="text-ink-faint" aria-hidden />
      {children}
    </span>
  );
}
