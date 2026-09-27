"use client";

import { useRef } from "react";
import { AlertTriangle, HelpCircle } from "lucide-react";
import clsx from "clsx";
import { Sheet } from "./Sheet";
import { btnDangerSolid, btnPrimary, btnSecondary } from "./Button";

/** In-app replacement for window.confirm — a native-style action sheet on
 * phones and a centred card from `sm` up: a large icon, then the subject
 * name (or title), then the message, then the actions (stacked full-width
 * on phones, confirm on top). Escape / backdrop-click cancels; focus lands
 * on the confirm button. */
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
  const Icon = danger ? AlertTriangle : HelpCircle;
  const heading = name || title;

  return (
    <Sheet
      open={open}
      onClose={onCancel}
      label={heading}
      role="alertdialog"
      widthClassName="sm:max-w-sm"
      initialFocusRef={confirmRef}
      zIndexClassName="z-[85]"
    >
      <div className="px-6 pb-6 pt-2 text-center sm:p-7">
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

        <div className="mt-6 flex flex-col-reverse gap-2.5 sm:flex-row sm:items-center sm:justify-center sm:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className={clsx(btnSecondary, "w-full sm:w-auto")}
          >
            {cancelLabel}
          </button>
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            className={clsx(danger ? btnDangerSolid : btnPrimary, "w-full px-6 sm:w-auto")}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Sheet>
  );
}
