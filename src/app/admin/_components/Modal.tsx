"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import clsx from "clsx";

/** Generic dialog shell — same backdrop / Escape / focus-on-open behaviour
 * as ConfirmDialog, but with title/children/footer slots so it can host an
 * arbitrary form instead of a fixed icon+message layout. */
export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  widthClassName = "max-w-md",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  widthClassName?: string;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center bg-ink/40 px-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        className={clsx(
          "max-h-[90vh] w-full overflow-y-auto rounded-2xl border border-ink/10 bg-white p-6 shadow-soft",
          widthClassName
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <h2 className="font-kurdish text-fluid-lg font-bold text-ink">{title}</h2>
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="داخستن"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-canvas-paper hover:text-ink"
          >
            <X size={16} />
          </button>
        </div>
        <div className="mt-4">{children}</div>
        {footer && <div className="mt-6 flex flex-wrap items-center justify-end gap-3">{footer}</div>}
      </div>
    </div>
  );
}
