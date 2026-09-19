"use client";

import { useEffect, useRef } from "react";
import { Clock3, MessageCircle, Phone, X } from "lucide-react";
import { DeleteButton } from "../../_components/DeleteButton";
import { toWhatsAppLink } from "../../_components/whatsapp";
import { deleteMessage } from "./actions";
import { formatMessageDate } from "./formatMessageDate";
import { MessageAvatar } from "./MessageAvatar";
import type { ContactMessageRow } from "@/lib/supabase/database.types";
import { CONTACT_SUBJECT_LABELS_KU, type ContactSubject } from "@/lib/contactSubjects";

/** Right-edge detail drawer opened from a MessageCard. Not portaled —
 * unlike NotificationModal's bell trigger, everything this mounts under
 * (AdminShell's <main>) is free of any backdrop-filter ancestor, so a fixed
 * overlay here sizes against the real viewport already. */
export function MessageDrawer({
  message,
  onClose,
}: {
  message: ContactMessageRow | null;
  onClose: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!message) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div className="fixed inset-0 z-[70]" onClick={onClose}>
      <div className="absolute inset-0 animate-overlay-in bg-ink/40 backdrop-blur-sm" />

      <div
        dir="rtl"
        role="dialog"
        aria-modal="true"
        aria-label={message.name}
        onClick={(e) => e.stopPropagation()}
        className="animate-drawer-in absolute inset-y-0 right-0 flex w-full max-w-md flex-col border-e border-ink/10 bg-white shadow-soft"
      >
        <div className="flex items-center justify-between gap-3 border-b border-ink/10 px-5 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <MessageAvatar name={message.name} unread={!message.is_read} size="lg" />
            <div className="min-w-0">
              <p className="font-kurdish truncate text-fluid-base font-semibold text-ink">{message.name}</p>
              <p
                className={
                  message.is_read
                    ? "font-kurdish text-fluid-xs text-ink-faint"
                    : "font-kurdish text-fluid-xs font-medium text-emerald-700"
                }
              >
                {message.is_read ? "خوێندراوە" : "نەخوێندراوە"}
              </p>
            </div>
          </div>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="داخستن"
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink"
          >
            <X size={17} />
          </button>
        </div>

        <div className="flex flex-col gap-3 border-b border-ink/10 px-5 py-4">
          <a
            href={`tel:${message.phone}`}
            dir="ltr"
            className="inline-flex w-fit items-center gap-1.5 text-fluid-sm font-bold text-pigment-terracotta hover:underline"
          >
            <Phone size={14} /> {message.phone}
          </a>
          <div className="flex flex-wrap items-center gap-2">
            <div dir="ltr" className="flex w-fit items-center gap-1.5 text-fluid-xs font-bold text-ink-faint">
              <Clock3 size={13} /> {formatMessageDate(message.created_at)}
            </div>
            <span className="font-kurdish rounded-full bg-canvas-paper px-2.5 py-0.5 text-[10px] font-medium text-ink-soft">
              {CONTACT_SUBJECT_LABELS_KU[message.subject as ContactSubject] ?? CONTACT_SUBJECT_LABELS_KU.general}
            </span>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          <p className="font-kurdish whitespace-pre-wrap text-fluid-base leading-relaxed text-ink">
            {message.message}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 px-5 py-4">
          <a
            href={`tel:${message.phone}`}
            className="font-kurdish inline-flex items-center gap-1.5 rounded-full bg-[#850B10] px-5 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
          >
            <Phone size={15} /> پەیوەندیکردن
          </a>
          <a
            href={toWhatsAppLink(message.phone)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-kurdish inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-5 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-emerald-700"
          >
            <MessageCircle size={15} /> واتساپ
          </a>
          <span className="mr-auto">
            <DeleteButton
              action={deleteMessage.bind(null, message.id)}
              confirmMessage="ئەم پەیامە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
            />
          </span>
        </div>
      </div>
    </div>
  );
}
