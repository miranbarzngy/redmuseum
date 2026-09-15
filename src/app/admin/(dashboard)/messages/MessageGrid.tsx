import Link from "next/link";
import clsx from "clsx";
import { Phone } from "lucide-react";
import { formatMessageDateParts } from "./formatMessageDate";
import type { ContactMessageRow } from "@/lib/supabase/database.types";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "؟";
}

/** Sender avatar: filled terracotta with a glowing unread dot for unread
 * messages, muted paper tone once read — mirrors BookingsBoard's Avatar so
 * the two inbox-style lists read as one family. */
function Avatar({ name, unread }: { name: string; unread: boolean }) {
  return (
    <span className="relative shrink-0">
      <span
        className={clsx(
          "flex h-11 w-11 items-center justify-center rounded-full text-fluid-sm font-semibold",
          unread ? "bg-pigment-terracotta text-white" : "bg-canvas-paper text-ink-soft"
        )}
      >
        {initials(name)}
      </span>
      {unread && (
        <span
          aria-label="نەخوێندراوە"
          className="absolute -end-0.5 -top-0.5 h-3 w-3 rounded-full bg-[#850B10] ring-2 ring-white"
        />
      )}
    </span>
  );
}

/** One-per-row card list of contact messages — an avatar carries the
 * read/unread state (filled + dot vs. muted), so the row itself stays
 * clean: name, phone and timestamp on one line, a message preview below. */
export function MessageGrid({ messages }: { messages: ContactMessageRow[] }) {
  return (
    <div className="grid grid-cols-1 gap-4">
      {messages.map((m) => {
        const { time, date } = formatMessageDateParts(m.created_at);
        return (
          <Link
            key={m.id}
            href={`/admin/messages/${m.id}`}
            className={clsx(
              "flex gap-4 rounded-2xl border p-5 shadow-card transition-all hover:-translate-y-0.5 hover:shadow-lg",
              m.is_read ? "border-ink/10 bg-white" : "border-pigment-teal bg-pigment-teal/25"
            )}
          >
            <Avatar name={m.name} unread={!m.is_read} />

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
                <span className="min-w-0">
                  <span
                    className={clsx(
                      "block truncate",
                      m.is_read ? "font-medium text-ink" : "font-semibold text-ink"
                    )}
                  >
                    {m.name}
                  </span>
                  <span dir="ltr" className="mt-0.5 flex items-center gap-1 text-fluid-xs text-ink-faint">
                    <Phone size={11} className="shrink-0" aria-hidden />
                    {m.phone}
                  </span>
                </span>
                <span dir="ltr" className="flex shrink-0 flex-col items-center text-center text-fluid-xs text-ink-faint">
                  <span>{time}</span>
                  <span>{date}</span>
                </span>
              </div>
              <div className="mt-3 border-t border-pigment-crimson/40" />
              <p className="mt-3 line-clamp-2 text-fluid-sm text-ink-faint">{m.message}</p>
            </div>
          </Link>
        );
      })}
    </div>
  );
}
