"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { Loader2, Play } from "lucide-react";
import clsx from "clsx";
import { Panel } from "../../_components/Panel";
import {
  NOTIFICATION_SOUNDS,
  soundPreviewUrl,
  type NotificationSoundId,
} from "@/lib/notificationSounds";
import { updateNotificationSound } from "./actions";

export function NotificationSoundPanel({ initial }: { initial: NotificationSoundId }) {
  const [sound, setSound] = useState(initial);
  const [status, setStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saving, startSaving] = useTransition();
  const audio = useRef<HTMLAudioElement | null>(null);

  useEffect(() => () => audio.current?.pause(), []);

  function preview(id: NotificationSoundId) {
    audio.current?.pause();
    const url = soundPreviewUrl(id);
    if (!url) return;
    audio.current = new Audio(url);
    audio.current.play().catch(() => {});
  }

  function select(id: NotificationSoundId) {
    preview(id);
    if (id === sound || saving) return;
    const prev = sound;
    setSound(id);
    setStatus("idle");
    startSaving(async () => {
      const { ok } = await updateNotificationSound(id).catch(() => ({ ok: false }));
      if (ok) {
        setStatus("saved");
      } else {
        setSound(prev);
        setStatus("error");
      }
    });
  }

  return (
    <Panel
      title="دەنگی ئاگادارکردنەوە"
      description="ئەو دەنگەی لە مۆبایلەکان لێدەدرێت کاتێک داواکاری سەردان یان پەیامی نوێ دێت."
    >
      <div role="radiogroup" aria-label="دەنگی ئاگادارکردنەوە" className="flex flex-col gap-2">
        {NOTIFICATION_SOUNDS.map((s) => {
          const active = s.id === sound;
          return (
            <div
              key={s.id}
              className={clsx(
                "flex items-center rounded-xl border transition-colors",
                active ? "border-[#850B10] bg-[#850B10]/[0.06]" : "border-ink/10"
              )}
            >
              <button
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => select(s.id)}
                className="flex min-w-0 flex-1 items-center gap-3 px-3 py-2.5 text-start"
              >
                <span
                  className={clsx(
                    "flex h-[18px] w-[18px] shrink-0 items-center justify-center rounded-full border-2",
                    active ? "border-[#850B10]" : "border-ink/30"
                  )}
                >
                  {active && <span className="h-2 w-2 rounded-full bg-[#850B10]" />}
                </span>
                <span className="font-kurdish min-w-0">
                  <span className="block text-fluid-sm font-medium text-ink">{s.label}</span>
                  <span className="block text-fluid-xs text-ink-faint">{s.description}</span>
                </span>
              </button>
              {soundPreviewUrl(s.id) && (
                <button
                  type="button"
                  aria-label={`گوێگرتن لە ${s.label}`}
                  onClick={() => preview(s.id)}
                  className="me-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink-soft hover:bg-ink/[0.06]"
                >
                  <Play size={16} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      <p className="font-kurdish mt-3 flex min-h-5 items-center gap-2 text-fluid-xs">
        {saving ? (
          <>
            <Loader2 size={14} className="animate-spin" /> پاشەکەوت دەکرێت…
          </>
        ) : status === "saved" ? (
          <span className="text-emerald-700">✓ پاشەکەوتکرا</span>
        ) : status === "error" ? (
          <span className="text-pigment-crimson">پاشەکەوتکردن سەرکەوتوو نەبوو</span>
        ) : (
          <span className="text-ink-faint">دەنگە تایبەتەکان پێویستیان بە وەشانی 1.4ی ئەپ هەیە.</span>
        )}
      </p>
    </Panel>
  );
}
