"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import clsx from "clsx";

/** In-app replacement for window.confirm — a centred modal: a large icon,
 * then the subject name (or title), then the message, then the actions.
 * Escape / backdrop-click cancels; focus lands on the confirm button. */
export function ConfirmDialog({
  open,
  title = "دڵنیایت؟",
  name,
  message,
  confirmLabel = "سڕینەوە",
  cancelLabel = "پاشگەزبوونەوە",
  onConfirm,
  onCancel,
  danger = true,
}: {
  open: boolean;
  title?: string;
  /** Subject of the action (e.g. the visitor's name), shown prominently. */
  name?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
}) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    confirmRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const Icon = danger ? AlertTriangle : HelpCircle;
  const heading = name || title;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-7 text-center shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <span
          className={clsx(
            "mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full",
            danger ? "bg-pigment-crimson/10 text-pigment-crimson" : "bg-[#850B10]/10 text-[#850B10]"
          )}
        >
          <Icon size={30} strokeWidth={2.25} />
        </span>

        <h2 className="font-kurdish text-fluid-lg font-bold text-ink">{heading}</h2>
        <p className="font-kurdish mt-2 text-fluid-sm leading-relaxed text-ink-soft">{message}</p>

        <div className="mt-6 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="font-kurdish rounded-full border border-ink/15 px-5 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-ink/30"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={clsx(
              "font-kurdish rounded-full px-6 py-2.5 text-fluid-sm font-medium text-canvas transition-colors",
              danger ? "bg-pigment-crimson hover:bg-pigment-crimson/90" : "bg-[#850B10] hover:bg-[#6a090d]"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
