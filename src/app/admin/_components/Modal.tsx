"use client";

import { useRef } from "react";
import { X } from "lucide-react";
import { Sheet } from "./Sheet";

/** Generic dialog shell — a bottom sheet on phones, a centred card from
 * `sm` up (see Sheet.tsx), with title/children/footer slots so it can host
 * an arbitrary form instead of ConfirmDialog's fixed icon+message layout.
 * `widthClassName` caps the card from `sm` up, e.g. "sm:max-w-2xl". */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  widthClassName = "sm:max-w-md",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  return (
    <Sheet open={open} onClose={onClose} label={title} widthClassName={widthClassName} initialFocusRef={closeRef}>
      <div className="flex shrink-0 items-start justify-between gap-3 px-5 pb-3 sm:px-6 sm:pt-6">
        <h2 className="font-kurdish text-fluid-lg font-bold text-ink">{title}</h2>
        <button
          ref={closeRef}
          type="button"
          onClick={onClose}
          aria-label="داخستن"
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas-paper text-ink-faint transition-colors hover:text-ink active:scale-90"
        >
          <X size={16} />
        </button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-5 sm:px-6 sm:pb-6">{children}</div>
      {footer && (
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-3 border-t border-ink/10 px-5 py-4 sm:px-6 [&>*]:flex-1 sm:[&>*]:flex-none">
          {footer}
        </div>
      )}
    </Sheet>
  );
}
