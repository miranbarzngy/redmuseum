"use client";

import { useState } from "react";
import clsx from "clsx";
import { Bell } from "lucide-react";
import type { AdminNotifications } from "./adminNotificationsShape";
import { NotificationModal } from "./NotificationModal";

/**
 * Header notification bell (top-left of the page — the opposite end from
 * the section title, since AdminShell's header is RTL). Shows a combined
 * unread badge (pending bookings + unread messages) and opens
 * NotificationModal with the most recent of each, deep-linking to the item.
 * Data comes from getAdminNotifications() via the dashboard layout — this
 * component is purely presentational and manages only its own open state.
 * Rendered once in AdminShell's header, so it's reachable on desktop too,
 * not just the phone bottom bar.
 */
export function NotificationsBell({ notifications }: { notifications: AdminNotifications }) {
  const [open, setOpen] = useState(false);
  const { total } = notifications;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label={total > 0 ? `ئاگادارییەکان — ${total}` : "ئاگادارییەکان"}
        className={clsx(
          "relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors",
          open ? "bg-[#850B10]/12 text-[#850B10]" : "text-ink-faint hover:bg-canvas-paper hover:text-ink-soft",
        )}
      >
        <Bell strokeWidth={open ? 2.4 : 2} className="h-[19px] w-[19px]" />
        {total > 0 && (
          <span className="absolute top-1 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-pigment-crimson px-1 text-[9px] font-bold leading-none text-canvas ring-2 ring-white">
            {total > 9 ? "9+" : total}
          </span>
        )}
      </button>

      <NotificationModal open={open} onClose={() => setOpen(false)} notifications={notifications} />
    </>
  );
}
