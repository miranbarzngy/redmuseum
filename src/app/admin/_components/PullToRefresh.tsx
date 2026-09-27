"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { ArrowDown, Loader2 } from "lucide-react";

const THRESHOLD_PX = 72;
const MAX_PULL_PX = 110;

// Touches that start on any of these never turn into a pull: open dialogs,
// form controls, dnd-kit's sortable cards (they spread
// aria-roledescription="sortable"), and anything opted out explicitly.
const IGNORE_SELECTOR =
  '[role="dialog"], [role="alertdialog"], [aria-roledescription="sortable"], input, textarea, select, [data-no-pull]';

/**
 * Native pull-to-refresh for touch screens: drag down from the very top of
 * the page and let go past the threshold to re-fetch the current page's
 * server data with router.refresh() — a soft refresh that keeps scroll,
 * open tabs and filters, instead of the browser's full reload (which
 * globals.css turns off for /admin via overscroll-behavior).
 *
 * The indicator is a Material-style spinner that drops in under the top
 * bar; the page itself doesn't move. Touch events only, so mouse and
 * trackpad users on desktop never see it.
 */
export function PullToRefresh() {
  const router = useRouter();
  const [refreshing, startRefresh] = useTransition();
  const [pull, setPull] = useState(0);
  const refreshRef = useRef(() => {});

  useEffect(() => {
    refreshRef.current = () => startRefresh(() => router.refresh());
  });

  useEffect(() => {
    let startX = 0;
    let startY = 0;
    let tracking = false;
    let pulling = false;
    let current = 0;

    function reset() {
      tracking = false;
      pulling = false;
      current = 0;
      setPull(0);
    }

    function onStart(e: TouchEvent) {
      if (e.touches.length !== 1 || window.scrollY > 0) return;
      // A sheet or drawer is open (they lock body scroll).
      if (document.body.style.overflow === "hidden") return;
      if (e.target instanceof Element && e.target.closest(IGNORE_SELECTOR)) return;
      startX = e.touches[0].clientX;
      startY = e.touches[0].clientY;
      tracking = true;
      pulling = false;
    }

    function onMove(e: TouchEvent) {
      if (!tracking) return;
      const dx = e.touches[0].clientX - startX;
      const dy = e.touches[0].clientY - startY;
      if (!pulling) {
        // Decide once, on the first clear movement: a sideways or upward
        // gesture is a scroll/swipe, not a pull.
        if (Math.abs(dx) > Math.abs(dy) || dy < 0) {
          tracking = false;
          return;
        }
        if (dy < 10) return;
        pulling = true;
      }
      if (window.scrollY > 0) {
        reset();
        return;
      }
      // Rubber-band: the indicator lags the finger more the further it goes.
      current = Math.min(MAX_PULL_PX, (dy - 10) * 0.55);
      setPull(current);
    }

    function onEnd() {
      if (!tracking) return;
      if (pulling && current >= THRESHOLD_PX) refreshRef.current();
      reset();
    }

    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchmove", onMove, { passive: true });
    window.addEventListener("touchend", onEnd);
    window.addEventListener("touchcancel", reset);
    return () => {
      window.removeEventListener("touchstart", onStart);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onEnd);
      window.removeEventListener("touchcancel", reset);
    };
  }, []);

  const visible = refreshing || pull > 0;
  const armed = pull >= THRESHOLD_PX;
  const offset = refreshing ? 28 : pull * 0.6;

  return (
    <div
      aria-hidden={!refreshing}
      role={refreshing ? "status" : undefined}
      className={clsx(
        "pointer-events-none fixed inset-x-0 z-20 flex justify-center",
        "top-[calc(env(safe-area-inset-top)+3.5rem)]",
        !visible && "invisible",
      )}
    >
      <span
        className={clsx(
          "flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-card ring-1 ring-ink/5",
          pull === 0 && "transition-[transform,opacity] duration-200",
          armed || refreshing ? "text-[#850B10]" : "text-ink-faint",
        )}
        style={{
          transform: `translateY(${offset - 12}px) scale(${refreshing ? 1 : 0.6 + Math.min(1, pull / THRESHOLD_PX) * 0.4})`,
          opacity: refreshing ? 1 : Math.min(1, pull / (THRESHOLD_PX * 0.6)),
        }}
      >
        {refreshing ? (
          <Loader2 size={18} strokeWidth={2.5} className="animate-spin" />
        ) : (
          <ArrowDown
            size={18}
            strokeWidth={2.5}
            className="transition-transform duration-200"
            style={{ transform: armed ? "rotate(180deg)" : undefined }}
          />
        )}
        {refreshing && <span className="sr-only">نوێکردنەوە…</span>}
      </span>
    </div>
  );
}
