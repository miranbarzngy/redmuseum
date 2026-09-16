"use client";

import { useState, useTransition, type MouseEvent } from "react";
import clsx from "clsx";
import { Check, Copy, Loader2, Phone, Trash2 } from "lucide-react";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";
import { formatMessageDateParts } from "./formatMessageDate";
import { deleteMessage } from "./actions";
import { MessageAvatar } from "./MessageAvatar";
import type { ContactMessageRow } from "@/lib/supabase/database.types";

/**
 * One inbox row. The whole card opens the detail drawer; a small action row
 * swaps in over the timestamp on hover (desktop only — touch users go
 * through the drawer for everything) so the layout never reflows. The
 * confirm dialog is wrapped in its own stopPropagation div because it's a
 * DOM child of the clickable card — without that, dismissing it would bubble
 * back up into the card's own onClick and reopen the drawer.
 */
export function MessageCard({
  message,
  active,
  onOpen,
  onMarkRead,
}: {
  message: ContactMessageRow;
  active: boolean;
  onOpen: () => void;
  onMarkRead: () => void;
}) {
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [isDeleting, startDelete] = useTransition();
  const toast = useToast();
  const { time, date } = formatMessageDateParts(message.created_at);
  const unread = !message.is_read;

  async function handleCopyPhone(e: MouseEvent) {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(message.phone);
      toast.show("ژمارە کۆپی کرا.");
    } catch {
      toast.show("نەتوانرا ژمارەکە کۆپی بکرێت.", "error");
    }
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpen();
        }
      }}
      className={clsx(
        "group flex cursor-pointer gap-4 rounded-2xl border p-4 shadow-card outline-none transition-all hover:-translate-y-0.5 hover:shadow-lg focus-visible:ring-2 focus-visible:ring-emerald-500/40 sm:p-5",
        active
          ? "border-emerald-500/60 bg-emerald-50/70 ring-1 ring-emerald-500/30"
          : unread
            ? "border-emerald-500/25 bg-emerald-50/40"
            : "border-ink/10 bg-white",
      )}
    >
      <MessageAvatar name={message.name} unread={unread} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-1">
          <span className="min-w-0">
            <span
              className={clsx(
                "font-kurdish block truncate",
                unread ? "font-bold text-ink" : "font-medium text-ink-soft",
              )}
            >
              {message.name}
            </span>
            <span dir="ltr" className="mt-0.5 flex items-center gap-1 text-fluid-xs font-bold text-ink-soft">
              <Phone size={11} className="shrink-0 text-ink-faint" aria-hidden />
              {message.phone}
            </span>
          </span>

          {/* Fixed-size slot: timestamp fades out, quick actions fade in —
              swapping in place instead of shifting the row on hover. */}
          <div className="relative h-8 w-[108px] shrink-0">
            <span
              dir="ltr"
              className="absolute inset-0 flex flex-col items-center justify-center text-center text-fluid-xs font-bold text-ink-soft transition-opacity duration-150 group-hover:opacity-0 group-focus-within:opacity-0"
            >
              <span>{time}</span>
              <span>{date}</span>
            </span>
            <div
              className="absolute inset-0 flex items-center justify-center gap-1 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-focus-within:opacity-100"
              onClick={(e) => e.stopPropagation()}
            >
              {unread && (
                <button
                  type="button"
                  onClick={onMarkRead}
                  aria-label="وەک خوێندراو نیشانبکە"
                  title="وەک خوێندراو نیشانبکە"
                  className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white text-ink-faint shadow-ring transition-colors hover:border-emerald-500/50 hover:text-emerald-600"
                >
                  <Check size={14} />
                </button>
              )}
              <button
                type="button"
                onClick={handleCopyPhone}
                aria-label="کۆپیکردنی ژمارە"
                title="کۆپیکردنی ژمارە"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white text-ink-faint shadow-ring transition-colors hover:border-pigment-terracotta/50 hover:text-pigment-terracotta"
              >
                <Copy size={13} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setConfirmOpen(true);
                }}
                disabled={isDeleting}
                aria-label="سڕینەوە"
                title="سڕینەوە"
                className="flex h-8 w-8 items-center justify-center rounded-full border border-ink/10 bg-white text-ink-faint shadow-ring transition-colors hover:border-pigment-crimson/50 hover:text-pigment-crimson disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={13} className="animate-spin" /> : <Trash2 size={13} />}
              </button>
            </div>
          </div>
        </div>

        <div className="mt-3 border-t border-ink/10" />
        <p
          className={clsx(
            "font-kurdish mt-3 line-clamp-2 text-fluid-sm",
            unread ? "text-ink-soft" : "text-ink-faint",
          )}
        >
          {message.message}
        </p>
      </div>

      <div onClick={(e) => e.stopPropagation()}>
        <ConfirmDialog
          open={confirmOpen}
          name={message.name}
          message="ئەم پەیامە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
          onCancel={() => setConfirmOpen(false)}
          onConfirm={() => {
            setConfirmOpen(false);
            startDelete(() => deleteMessage(message.id));
          }}
        />
      </div>
    </div>
  );
}
