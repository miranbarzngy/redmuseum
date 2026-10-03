"use client";

import { useEffect } from "react";
import { useLocale } from "next-intl";
import { HOME_SECTIONS } from "@/lib/homeSections";
import { scrollToId } from "@/lib/scrollTo";

// Every path this component has put in the address bar while the homepage
// is mounted. VisitTracker skips these — it's the same page view scrolling
// along, not a navigation. Cleared on unmount, which React runs before the
// next page's effects, so actually navigating to e.g. /contact still counts.
const syncedPaths = new Set<string>();

export function isScrollSyncedPath(path: string) {
  return syncedPaths.has(path);
}

/** The last section whose top has scrolled above 40% of the viewport — or
 * the last one outright at the very bottom, where a short final section may
 * never get that high. */
function activeSectionSlug(): string {
  const line = window.innerHeight * 0.4;
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2;
  let active: string = HOME_SECTIONS[0].slug;
  for (const { id, slug } of HOME_SECTIONS) {
    const el = document.getElementById(id);
    if (el && (atBottom || el.getBoundingClientRect().top <= line)) active = slug;
  }
  return active;
}

/**
 * Renders nothing — keeps the address bar on the homepage section being
 * read (/ku/museums, /ku/gallery, …) as the visitor scrolls, and, when the
 * page was opened at one of those URLs, jumps straight to that section.
 */
export function HomeSectionUrlSync({ initialSectionId }: { initialSectionId?: string }) {
  const locale = useLocale();

  useEffect(() => {
    if (initialSectionId) scrollToId(initialSectionId, { immediate: true });

    let frame = 0;
    function sync() {
      frame = 0;
      const path = `/${locale}/${activeSectionSlug()}`;
      if (path === window.location.pathname) return;
      syncedPaths.add(path);
      try {
        // Next.js follows this (usePathname updates) without refetching or
        // re-rendering the page, and replacing rather than pushing keeps the
        // back button from stepping through every section scrolled past.
        window.history.replaceState(null, "", path + window.location.search);
      } catch {
        // Safari throws once replaceState is called too often in a short
        // window — the URL just catches up on the next scroll.
      }
    }
    function onScroll() {
      if (!frame) frame = requestAnimationFrame(sync);
    }

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(frame);
      syncedPaths.clear();
    };
  }, [locale, initialSectionId]);

  return null;
}
