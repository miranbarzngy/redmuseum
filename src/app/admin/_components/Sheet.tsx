"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { BodyPortal } from "./BodyPortal";

const CLOSE_MS = 220;
// Release past this many px, or flick down faster than this, to dismiss.
const DISMISS_DISTANCE_PX = 110;
const DISMISS_VELOCITY = 0.6; // px per ms

/**
 * Shared overlay behind every admin dialog, shaped like a native app's: a
 * bottom sheet on phones (grab handle, swipe down to dismiss, safe-area
 * padding) and, with `desktop="center"`, a centred card from `sm` up.
 *
 * Portaled to <body> (see BodyPortal) so no transformed or blurred
 * ancestor can become the containing block of its `fixed` overlay. Locks
 * page scroll while open, closes on Escape and on a backdrop tap, and plays
 * a short exit animation before calling `onClose` for closes it starts
 * itself. A parent that flips `open` to false directly (e.g. after a
 * successful save) just unmounts it.
 */
export function Sheet(props: SheetProps) {
  if (!props.open) return null;
  return <SheetPanel {...props} />;
}

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Accessible name for the dialog. */
  label: string;
  role?: "dialog" | "alertdialog";
  /** From `sm` up: a centred card, or stay a bottom sheet. */
  desktop?: "center" | "sheet";
  /** Width cap from `sm` up, e.g. "sm:max-w-md". */
  widthClassName?: string;
  /** `glass`: frosted, translucent panel with a lit top edge (iOS sheet) —
   * for content laid out as white inset groups, which it sets off the way
   * iOS's grouped background does. Default: solid white. */
  surface?: "solid" | "glass";
  className?: string;
  /** Receives focus on open; defaults to the panel itself. */
  initialFocusRef?: React.RefObject<HTMLElement | null>;
  zIndexClassName?: string;
  children: React.ReactNode;
};

function SheetPanel({
  onClose,
  label,
  role = "dialog",
  desktop = "center",
  widthClassName = "sm:max-w-md",
  surface = "solid",
  className,
  initialFocusRef,
  zIndexClassName = "z-[80]",
  children,
}: SheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const [closing, setClosing] = useState(false);
  const [dragY, setDragY] = useState(0);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ startY: number; lastY: number; lastT: number; velocity: number } | null>(null);
  const onCloseRef = useRef(onClose);
  const closeTimer = useRef<number | null>(null);

  useEffect(() => {
    onCloseRef.current = onClose;
  });

  const requestClose = useCallback(() => {
    if (closeTimer.current !== null) return;
    setClosing(true);
    closeTimer.current = window.setTimeout(() => onCloseRef.current(), CLOSE_MS);
  }, []);

  useEffect(() => {
    (initialFocusRef?.current ?? panelRef.current)?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") requestClose();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      if (closeTimer.current !== null) window.clearTimeout(closeTimer.current);
    };
  }, [requestClose, initialFocusRef]);

  function onPointerDown(e: React.PointerEvent) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { startY: e.clientY, lastY: e.clientY, lastT: e.timeStamp, velocity: 0 };
    setDragging(true);
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = drag.current;
    if (!d) return;
    const dt = Math.max(1, e.timeStamp - d.lastT);
    d.velocity = (e.clientY - d.lastY) / dt;
    d.lastY = e.clientY;
    d.lastT = e.timeStamp;
    setDragY(Math.max(0, e.clientY - d.startY));
  }

  function onPointerUp() {
    const d = drag.current;
    drag.current = null;
    setDragging(false);
    if (!d) return;
    const distance = d.lastY - d.startY;
    if (distance > DISMISS_DISTANCE_PX || (distance > 24 && d.velocity > DISMISS_VELOCITY)) {
      requestClose();
    } else {
      setDragY(0);
    }
  }

  const centered = desktop === "center";

  return (
    <BodyPortal>
      <div
        className={clsx(
          "fixed inset-0 flex items-end justify-center",
          centered && "sm:items-center sm:p-6",
          zIndexClassName,
        )}
        // React events bubble through portals along the component tree, not
        // the DOM — stop clicks here so a tap inside the sheet can never reach
        // a clickable card the sheet was opened from.
        onClick={(e) => e.stopPropagation()}
      >
        <div
          aria-hidden
          onClick={requestClose}
          className={clsx(
            "absolute inset-0 bg-ink/40 backdrop-blur-sm transition-opacity duration-200",
            closing ? "opacity-0" : "animate-overlay-in",
          )}
          style={dragY > 0 && !closing ? { opacity: Math.max(0.2, 1 - dragY / 400) } : undefined}
        />

        <div
          ref={panelRef}
          role={role}
          aria-modal="true"
          aria-label={label}
          tabIndex={-1}
          className={clsx(
            "relative flex max-h-[92dvh] w-full flex-col overflow-hidden rounded-t-[1.75rem] shadow-soft outline-none",
            surface === "glass"
              ? clsx(
                  "border-t border-white/40 bg-white/80 backdrop-blur-xl backdrop-saturate-150",
                  centered && "sm:border",
                )
              : "bg-white",
            "pb-[env(safe-area-inset-bottom)]",
            centered && "sm:max-h-[85vh] sm:rounded-3xl sm:pb-0",
            widthClassName,
            !dragging && "transition-[transform,opacity] duration-200",
            // The entrance class stays put until closing (removing and re-adding
            // it would replay the slide-up after a drag snaps back); a finished
            // animation doesn't hold the transform, so drags still apply.
            closing
              ? clsx("translate-y-full ease-in", centered && "sm:translate-y-2 sm:scale-95 sm:opacity-0")
              : clsx("animate-sheet-in ease-out", centered && "sm:animate-modal-in"),
            className,
          )}
          style={dragY > 0 && !closing ? { transform: `translateY(${dragY}px)` } : undefined}
        >
          {/* Grab handle — the drag-to-dismiss zone. Phones only when the
              sheet becomes a centred card from `sm` up. */}
          <div
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            onPointerCancel={onPointerUp}
            className={clsx(
              "flex shrink-0 cursor-grab touch-none justify-center pb-1.5 pt-3 active:cursor-grabbing",
              centered && "sm:hidden",
            )}
          >
            <span className="h-1.5 w-10 rounded-full bg-ink/15" />
          </div>
          {children}
        </div>
      </div>
    </BodyPortal>
  );
}
