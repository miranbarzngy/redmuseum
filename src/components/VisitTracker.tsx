"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Renders nothing — fires a fire-and-forget beacon to /api/track-visit on
 * every page view, including client-side route changes (the App Router
 * doesn't re-run middleware for those, so a middleware-based logger would
 * miss anyone browsing between pages after the first load).
 */
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    fetch("/api/track-visit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: pathname }),
      keepalive: true,
    }).catch(() => {});
  }, [pathname]);

  return null;
}
