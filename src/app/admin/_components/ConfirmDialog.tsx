"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import clsx from "clsx";

/** In-app replacement for window.confirm — a small modal with Escape /
 * backdrop-click to cancel and focus moved to the confirm button. */
export function ConfirmDialog({
  open,
  title = "دڵنیایت؟",
  message,
  confirmLabel = "سڕینەوە",
  cancelLabel = "پاشگەزبوونەوە",
  onConfirm,
  onCancel,
  danger = true,
}: {
  open: boolean;
  title?: string;
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

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      onClick={onCancel}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-2xl border border-ink/10 bg-white p-6 shadow-soft"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-3">
          {danger && (
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pigment-crimson/10 text-pigment-crimson">
              <AlertTriangle size={17} />
            </span>
          )}
          <div className="min-w-0">
            <h2 className="font-kurdish text-fluid-base font-semibold text-ink">{title}</h2>
            <p className="font-kurdish mt-1 text-fluid-sm text-ink-soft">{message}</p>
          </div>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="font-kurdish rounded-full border border-ink/15 px-4 py-2 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-ink/30"
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={clsx(
              "font-kurdish rounded-full px-4 py-2 text-fluid-sm font-medium text-canvas transition-colors",
              danger
                ? "bg-pigment-crimson hover:bg-pigment-crimson/90"
                : "bg-ink hover:bg-pigment-terracotta"
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
