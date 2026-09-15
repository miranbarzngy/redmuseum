import Link from "next/link";
import clsx from "clsx";
import { Mail, MailOpen } from "lucide-react";
import { formatMessageDateParts } from "./formatMessageDate";
import type { ContactMessageRow } from "@/lib/supabase/database.types";

/** One-per-row card list of contact messages — unread ones get a terracotta
 * dot, tint and border. The whole card links to the message's detail page,
 * which is also where it gets marked read / deleted. */
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
              "flex flex-col gap-2 rounded-2xl border border-pigment-crimson/40 p-5 shadow-card transition-colors hover:border-pigment-crimson/70",
              m.is_read ? "bg-white" : "bg-pigment-terracotta/[0.04]"
            )}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={clsx(
                  "flex items-center gap-2 transition-colors",
                  m.is_read ? "font-medium text-ink" : "font-semibold text-ink"
                )}
              >
                {m.is_read ? (
                  <MailOpen size={15} className="shrink-0 text-ink-faint" aria-hidden />
                ) : (
                  <Mail size={15} className="shrink-0 text-pigment-terracotta" aria-label="نەخوێندراوە" />
                )}
                {m.name}
                <span dir="ltr" className="text-fluid-xs font-normal text-ink-faint">
                  · {m.phone}
                </span>
              </span>
              <span dir="ltr" className="flex shrink-0 flex-col items-end text-fluid-xs text-ink-faint">
                <span>{time}</span>
                <span>{date}</span>
              </span>
            </div>
            <p className="line-clamp-2 text-fluid-sm text-ink-faint">{m.message}</p>
          </Link>
        );
      })}
    </div>
  );
}
