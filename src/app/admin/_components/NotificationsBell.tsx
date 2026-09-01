"use client";

import { useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { Bell, Inbox, Ticket, X } from "lucide-react";
import type { AdminNotifications } from "./adminNotificationsShape";

/**
 * Bottom-nav notification bell. Shows a combined unread badge
 * (pending bookings + unread messages) and opens a bottom sheet listing the
 * most recent of each, deep-linking to the item. Data comes from
 * getAdminNotifications() via the dashboard layout — this component is
 * purely presentational and manages only its own open state, so it drops
 * into the mobile bar next to «زیاتر» without enlarging AdminShell.
 */
export function NotificationsBell({ notifications }: { notifications: AdminNotifications }) {
  const [open, setOpen] = useState(false);
  const { total, pendingBookings, unreadMessages, items } = notifications;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={total > 0 ? `ئاگادارییەکان — ${total}` : "ئاگادارییەکان"}
        className="group relative flex w-full flex-col items-center justify-center gap-1 py-2.5 outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#850B10]/25"
      >
        <span
          className={clsx(
            "relative flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ease-out",
            open
              ? "-translate-y-0.5 bg-[#850B10]/12 text-[#850B10]"
              : "translate-y-0 text-ink-faint group-hover:bg-canvas-paper group-hover:text-ink-soft",
          )}
        >
          <Bell
            size={19}
            strokeWidth={open ? 2.4 : 2}
            className="transition-transform duration-200 group-active:scale-90"
          />
          {total > 0 && (
            <span className="absolute -top-1 -right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pigment-crimson px-1 text-[9px] font-bold leading-none text-canvas ring-2 ring-white">
              {total > 9 ? "9+" : total}
            </span>
          )}
        </span>
        <span
          className={clsx(
            "font-kurdish whitespace-nowrap text-[10px] leading-none transition-colors duration-200",
            open ? "font-semibold text-[#850B10]" : "font-medium text-ink-faint",
          )}
        >
          ئاگاداری
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t border-ink/10 bg-white p-4"
            style={{ paddingBottom: "calc(1rem + env(safe-area-inset-bottom))" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-2 flex items-center justify-between">
              <span className="font-kurdish text-fluid-sm font-semibold text-ink">
                ئاگادارییەکان{total > 0 ? ` (${total})` : ""}
              </span>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="داخستن"
                className="flex h-8 w-8 items-center justify-center rounded-full text-ink-faint hover:bg-canvas-paper hover:text-ink"
              >
                <X size={16} />
              </button>
            </div>

            {items.length === 0 ? (
              <p className="font-kurdish py-8 text-center text-fluid-sm text-ink-faint">
                هیچ ئاگادارییەکت نییە.
              </p>
            ) : (
              <div className="flex max-h-[64vh] flex-col gap-1 overflow-y-auto">
                {items.map((item) => {
                  const Icon = item.kind === "booking" ? Ticket : Inbox;
                  return (
                    <Link
                      key={`${item.kind}-${item.id}`}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      className="flex items-start gap-3 rounded-xl px-2.5 py-2.5 transition-colors hover:bg-canvas-paper"
                    >
                      <span
                        className={clsx(
                          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                          item.kind === "booking"
                            ? "bg-pigment-gold/15 text-pigment-gold"
                            : "bg-pigment-crimson/12 text-pigment-crimson",
                        )}
                      >
                        <Icon size={15} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-2">
                          <span className="font-kurdish truncate text-fluid-sm font-medium text-ink">
                            {item.name}
                          </span>
                          <span dir="ltr" className="shrink-0 text-[11px] text-ink-faint">
                            {item.atLabel}
                          </span>
                        </span>
                        <span className="font-kurdish mt-0.5 line-clamp-1 text-fluid-xs text-ink-soft">
                          {item.detail}
                        </span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            )}

            {(pendingBookings > 0 || unreadMessages > 0) && (
              <div className="mt-2 flex gap-2 border-t border-ink/10 pt-2">
                {pendingBookings > 0 && (
                  <Link
                    href="/admin/bookings"
                    onClick={() => setOpen(false)}
                    className="font-kurdish flex-1 rounded-xl bg-canvas-paper px-3 py-2 text-center text-fluid-xs font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    سەردانەکان ({pendingBookings})
                  </Link>
                )}
                {unreadMessages > 0 && (
                  <Link
                    href="/admin/messages"
                    onClick={() => setOpen(false)}
                    className="font-kurdish flex-1 rounded-xl bg-canvas-paper px-3 py-2 text-center text-fluid-xs font-medium text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    پەیامەکان ({unreadMessages})
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
