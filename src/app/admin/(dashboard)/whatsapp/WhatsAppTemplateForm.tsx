"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { Plus } from "lucide-react";
import {
  WHATSAPP_MESSAGE_MAX_LENGTH,
  WHATSAPP_MESSAGE_TOKENS,
  fillWhatsAppMessage,
} from "../bookings/whatsAppMessage";
import { Field, fieldControlClass } from "../../_components/Field";
import { Panel } from "../../_components/Panel";
import { SaveBar } from "../../_components/SaveBar";
import type { BookingRow, WhatsAppTemplateRow } from "@/lib/supabase/database.types";

// Made-up booking the preview fills the placeholders from.
const SAMPLE_BOOKING: BookingRow = {
  id: "sample",
  name: "ئارام محەمەد",
  phone: "07501234567",
  visit_date: "2026-10-03",
  visit_time: "10:00",
  guest_count: 4,
  visitor_type_id: "",
  note: null,
  face_image_path: null,
  face_scan_consent: false,
  status: "confirmed",
  public_token: "a1b2c3d4-0000-0000-0000-000000000000",
  phone_key: "",
  created_at: "",
  updated_at: "",
};

// window.location.origin never changes, so there's nothing to subscribe to.
const subscribeNever = () => () => {};

/** One WhatsApp message: a title (what the admin picks it by when sending)
 * and the text. Placeholder chips insert at the cursor, so nobody has to
 * type `{name}` and friends by hand, and the preview shows the message as a
 * visitor would get it. */
export function WhatsAppTemplateForm({
  action,
  template,
}: {
  action: (formData: FormData) => Promise<void>;
  template?: WhatsAppTemplateRow;
}) {
  const [body, setBody] = useState(template?.body ?? "");
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const origin = useSyncExternalStore(subscribeNever, () => window.location.origin, () => "");
  const preview = body.trim() ? fillWhatsAppMessage(body.trim(), SAMPLE_BOOKING, origin) : "";

  function insertToken(token: string) {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? body.length;
    const end = el?.selectionEnd ?? body.length;
    const next = body.slice(0, start) + token + body.slice(end);
    if (next.length > WHATSAPP_MESSAGE_MAX_LENGTH) return;
    setBody(next);
    // Put the caret back after the inserted token once React has re-rendered.
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + token.length, start + token.length);
    });
  }

  return (
    <form action={action} className="flex flex-col gap-5">
      <Panel bodyClassName="flex flex-col gap-7">
        <Field
          label="ناونیشان"
          name="title"
          required
          defaultValue={template?.title ?? ""}
          placeholder="بۆ نموونە: پەسەندکردنی سەردان"
          hint="ناونیشان بۆ میوان نانێردرێت؛ لە کاتی ناردندا پەیامەکە بەم ناوە هەڵدەبژێریت."
          className="max-w-md"
        />

        <label className="flex flex-col gap-1.5">
          <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">
            دەقی پەیام<span className="text-pigment-crimson"> *</span>
          </span>
          <textarea
            ref={textareaRef}
            name="body"
            required
            value={body}
            onChange={(e) => setBody(e.target.value)}
            maxLength={WHATSAPP_MESSAGE_MAX_LENGTH}
            rows={14}
            dir="rtl"
            className={clsx(fieldControlClass, "resize-y leading-relaxed")}
          />
          <span dir="ltr" className="self-end text-fluid-xs text-ink-faint">
            {body.length}/{WHATSAPP_MESSAGE_MAX_LENGTH}
          </span>
        </label>

        <div className="flex flex-col gap-2.5">
          <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">زانیارییەکانی سەردان</span>
          <div className="flex flex-wrap gap-2">
            {WHATSAPP_MESSAGE_TOKENS.map(({ token, label }) => (
              <button
                key={token}
                type="button"
                onClick={() => insertToken(token)}
                className="font-kurdish inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-3 py-2 text-fluid-xs font-medium text-ink-soft transition-[colors,transform] duration-150 hover:border-pigment-terracotta hover:text-pigment-terracotta active:scale-95"
              >
                <Plus size={13} className="shrink-0" />
                {label}
                <span dir="ltr" className="font-mono text-[11px] text-ink-faint">
                  {token}
                </span>
              </button>
            ))}
          </div>
          <span className="font-kurdish text-fluid-xs text-ink-faint">
            کرتە لە هەر یەکێک بکە بۆ دانانی لە شوێنی نووسینەکەدا. لە کاتی ناردندا بە زانیاریی ڕاستەقینەی
            هەمان سەردان دەگۆڕدرێت.
          </span>
        </div>

        {preview && (
          <div className="flex flex-col gap-2.5">
            <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">پێشبینین (نموونە)</span>
            <p
              dir="rtl"
              className="font-kurdish max-w-md whitespace-pre-wrap break-words rounded-2xl rounded-ss-sm border border-emerald-600/15 bg-emerald-50 px-4 py-3 text-fluid-sm leading-relaxed text-ink"
            >
              {preview}
            </p>
          </div>
        )}
      </Panel>

      <SaveBar label={template ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی پەیام"} />
    </form>
  );
}
