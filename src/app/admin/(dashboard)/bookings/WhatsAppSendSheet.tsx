"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { MessageCircle, Send } from "lucide-react";
import { fillWhatsAppMessage } from "./whatsAppMessage";
import { Sheet } from "../../_components/Sheet";
import { btnSecondary, btnWhatsApp } from "../../_components/Button";
import { toWhatsAppLink } from "../../_components/whatsapp";
import type { BookingRow, WhatsAppTemplateRow } from "@/lib/supabase/database.types";

// window.location.origin never changes, so there's nothing to subscribe to.
const subscribeNever = () => () => {};

/** Pick one of the /admin/whatsapp messages (the first is preselected), see
 * it filled in for this booking, and open it in WhatsApp. Shown right after
 * a booking is accepted from the board, and from the WhatsApp button on a
 * card or in the drawer. The send button is a real <a>, not window.open()
 * after an async step — the tap is what lets the browser / Electron / the
 * APK's WebView hand wa.me off to WhatsApp. */
export function WhatsAppSendSheet({
  booking,
  templates,
  afterAccept,
  onClose,
}: {
  booking: BookingRow;
  /** Non-empty — callers only open the sheet when there's something to send. */
  templates: WhatsAppTemplateRow[];
  afterAccept: boolean;
  onClose: () => void;
}) {
  const [selectedId, setSelectedId] = useState(templates[0].id);
  const sendRef = useRef<HTMLAnchorElement>(null);
  const origin = useSyncExternalStore(subscribeNever, () => window.location.origin, () => "");

  const selected = templates.find((t) => t.id === selectedId) ?? templates[0];
  const message = fillWhatsAppMessage(selected.body, booking, origin);

  return (
    <Sheet
      open
      onClose={onClose}
      label={booking.name}
      widthClassName="sm:max-w-md"
      initialFocusRef={sendRef}
      zIndexClassName="z-[85]"
    >
      <div className="px-6 pb-6 pt-2 text-center sm:p-7">
        <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/10 text-emerald-700">
          <MessageCircle size={30} strokeWidth={2.25} />
        </span>

        <h2 className="font-kurdish text-fluid-lg font-bold text-ink">{booking.name}</h2>
        <p className="font-kurdish mt-2 text-fluid-sm leading-relaxed text-ink-soft">
          {afterAccept
            ? "سەردانەکە پەسەند کرا. پەیامێک بۆ واتساپی میوانەکە بنێردرێت؟"
            : "کام پەیام بۆ واتساپی میوانەکە بنێردرێت؟"}
        </p>

        {templates.length > 1 && (
          <div role="radiogroup" aria-label="پەیام" className="mt-4 flex flex-wrap justify-center gap-2">
            {templates.map((t) => {
              const active = t.id === selected.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSelectedId(t.id)}
                  className={clsx(
                    "font-kurdish max-w-full truncate rounded-full px-3.5 py-2 text-fluid-xs font-medium transition-[colors,transform] duration-150 active:scale-95",
                    active
                      ? "bg-emerald-600 text-white"
                      : "border border-ink/15 text-ink-soft hover:border-emerald-600 hover:text-emerald-700"
                  )}
                >
                  {t.title}
                </button>
              );
            })}
          </div>
        )}

        <p
          dir="rtl"
          className="font-kurdish mt-4 max-h-52 overflow-y-auto whitespace-pre-wrap break-words rounded-xl border-s-4 border-emerald-600/40 bg-canvas-soft/40 px-4 py-3 text-start text-fluid-xs leading-relaxed text-ink"
        >
          {message}
        </p>

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          <button type="button" onClick={onClose} className={clsx(btnSecondary, "w-full sm:w-auto")}>
            {afterAccept ? "دواتر" : "پاشگەزبوونەوە"}
          </button>
          <a
            ref={sendRef}
            href={toWhatsAppLink(booking.phone, message)}
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className={clsx(btnWhatsApp, "w-full px-6 sm:w-auto")}
          >
            <Send size={16} /> ناردن بە واتساپ
          </a>
        </div>
      </div>
    </Sheet>
  );
}
