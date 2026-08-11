"use client";

import { useEffect } from "react";
import Lenis from "lenis";

export function SmoothScrollProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t: number) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      // Touch stays native (no syncTouch) so mobile scrolling keeps the
      // browser's own momentum/inertia instead of being re-lerped by Lenis.
      syncTouch: false,
    });

    (window as unknown as { lenis?: Lenis }).lenis = lenis;

    let rafId: number;
    function raf(time: number) {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    }
    rafId = requestAnimationFrame(raf);

    // Mobile browsers resize the visual viewport (address bar show/hide)
    // without firing a window `resize` event — recompute Lenis's scroll
    // bounds so they don't go stale mid-scroll.
    function handleViewportResize() {
      lenis.resize();
    }
    window.visualViewport?.addEventListener("resize", handleViewportResize);
    window.addEventListener("orientationchange", handleViewportResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.visualViewport?.removeEventListener("resize", handleViewportResize);
      window.removeEventListener("orientationchange", handleViewportResize);
      lenis.destroy();
      delete (window as unknown as { lenis?: Lenis }).lenis;
    };
  }, []);

  return <>{children}</>;
}
