"use client";

import { useLayoutEffect, useRef } from "react";

/** Where a pill matching `el` goes inside `container`'s padding box (where
 * an absolutely positioned child's left/top 0 is). Positioned by centre and
 * sized from offsetWidth/Height, so a press-scale still settling on the
 * target doesn't shrink or shift the pill, while staying subpixel-exact
 * (offsetLeft/Top would round to whole pixels). */
function placementWithin(el: HTMLElement, container: HTMLElement) {
  const t = el.getBoundingClientRect();
  const c = container.getBoundingClientRect();
  const width = el.offsetWidth;
  const height = el.offsetHeight;
  return {
    width,
    height,
    x: t.left + t.width / 2 - c.left - container.clientLeft - width / 2,
    y: t.top + t.height / 2 - c.top - container.clientTop - height / 2,
  };
}

/**
 * One pill that slides to whichever element inside the container carries
 * `data-active="true"` — the native tab bar / segmented control motion,
 * without pulling an animation library into the admin bundle.
 *
 * Writes the pill's size and position straight to its style (no React
 * state, so no re-render per measurement), re-measuring when `activeKey`
 * changes and whenever the container or an item resizes. The container
 * must be positioned and not scroll (the pill is placed in its padding
 * box). The pill gets `data-ready="true"` only after its first placement,
 * so callers can gate the transition on it and the pill appears in place
 * on mount instead of flying in from the corner. With no active element
 * the pill fades out.
 *
 * Until JavaScript has run there is no pill, so the active item should
 * draw the same fill itself and drop it once the container is marked
 * `data-pill="ready"` — give the container `group/pill` and the item e.g.
 * `bg-brand-fill group-data-[pill=ready]/pill:bg-none`. The server-rendered
 * page then shows the active state from the first paint.
 */
export function useSlidingIndicator<C extends HTMLElement, I extends HTMLElement>(activeKey: unknown) {
  const containerRef = useRef<C>(null);
  const indicatorRef = useRef<I>(null);

  useLayoutEffect(() => {
    const container = containerRef.current;
    const indicator = indicatorRef.current;
    if (!container || !indicator) return;

    const place = () => {
      const target = container.querySelector<HTMLElement>('[data-active="true"]');
      if (!target) {
        indicator.style.opacity = "0";
        return;
      }
      const { x, y, width, height } = placementWithin(target, container);
      indicator.style.width = `${width}px`;
      indicator.style.height = `${height}px`;
      indicator.style.transform = `translate(${x}px, ${y}px)`;
      indicator.style.opacity = "1";
    };

    place();
    const frame = requestAnimationFrame(() => {
      indicator.dataset.ready = "true";
      container.dataset.pill = "ready";
    });
    // The container resizing, or any item resizing (e.g. once the Kurdish
    // web font swaps in and the labels change width), moves the target.
    const observer = new ResizeObserver(place);
    observer.observe(container);
    container.querySelectorAll<HTMLElement>("[data-active]").forEach((item) => observer.observe(item));
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [activeKey]);

  return { containerRef, indicatorRef };
}

/** Transition classes for a pill driven by useSlidingIndicator: off until
 * its first placement, then a springy slide/resize. */
export const slidingIndicatorMotion =
  "data-[ready=true]:transition-[transform,width,height,opacity] data-[ready=true]:duration-500 data-[ready=true]:ease-spring";
