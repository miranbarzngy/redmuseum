"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_EVENT = "admin:navigation-start";

/** For navigations that don't start from a link click — router.push in the
 * command palette, a tapped push notification, a filter form. Call it right
 * before router.push so the bar shows for those too. */
export function startNavigationProgress(href: string) {
  window.dispatchEvent(new CustomEvent<string>(START_EVENT, { detail: href }));
}

// Navigations that finish sooner than this never show the bar at all.
const SHOW_DELAY_MS = 120;
const TRICKLE_MS = 250;
// One that never settles (cancelled, failed) still stops the bar.
const SAFETY_MS = 15_000;

/** pathname + search of `href`, or null unless it's a same-origin admin page. */
function adminTarget(href: string): string | null {
  let url: URL;
  try {
    url = new URL(href, window.location.href);
  } catch {
    return null;
  }
  if (url.origin !== window.location.origin || !url.pathname.startsWith("/admin")) return null;
  return url.pathname + url.search;
}

const currentUrl = () => window.location.pathname + window.location.search;

/** Every admin route's loading.tsx skeleton (Skeleton.tsx) carries
 * aria-busy="true" until the real page streams in over it. */
const skeletonShowing = () => document.querySelector('#admin-main [aria-busy="true"]') !== null;

/**
 * The thin brand-red bar along the top while switching pages. Next has no
 * global navigation events, so it starts on a click on any internal admin
 * link (or startNavigationProgress for router.push), and finishes once the
 * address has changed *and* the destination's loading skeleton has been
 * replaced by the real page — with every route's skeleton prefetched, the
 * address alone changes almost at once, long before the content is in.
 *
 * Grows from the right (the panel is RTL) toward a glowing tip, trickling
 * toward 90% while it waits. Driven by writing the bar's style directly, so
 * the trickle never re-renders React.
 */
export function NavigationProgress() {
  const barRef = useRef<HTMLDivElement>(null);
  const checkRef = useRef<() => void>(() => {});
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const bar = barRef.current;
    if (!bar) return;

    let target: string | null = null;
    let progress = 0;
    let shown = false;
    let showTimer = 0;
    let trickleTimer = 0;
    let safetyTimer = 0;
    let hideTimer = 0;
    let observer: MutationObserver | null = null;

    const paint = (p: number) => {
      bar.style.width = `${p * 100}%`;
    };

    const resetInstantly = () => {
      bar.style.transition = "none";
      paint(0);
      void bar.offsetWidth; // commit the reset before transitions come back
      bar.style.transition = "";
    };

    const stopRun = () => {
      window.clearTimeout(showTimer);
      window.clearInterval(trickleTimer);
      window.clearTimeout(safetyTimer);
      observer?.disconnect();
      observer = null;
    };

    const finish = () => {
      if (target === null) return;
      target = null;
      stopRun();
      if (!shown) return;
      shown = false;
      paint(1);
      hideTimer = window.setTimeout(() => {
        bar.style.opacity = "0";
        hideTimer = window.setTimeout(resetInstantly, 300);
      }, 200);
    };

    const check = () => {
      if (target !== null && currentUrl() === target && !skeletonShowing()) finish();
    };

    const start = (next: string) => {
      // A link to the page already on screen loads nothing.
      if (target === null && next === currentUrl()) return;
      const wasShown = shown;
      target = next;
      stopRun();
      window.clearTimeout(hideTimer);

      showTimer = window.setTimeout(
        () => {
          if (!wasShown) {
            resetInstantly();
            progress = 0;
          }
          shown = true;
          bar.style.opacity = "1";
          progress = Math.max(progress, 0.22);
          paint(progress);
        },
        wasShown ? 0 : SHOW_DELAY_MS,
      );
      trickleTimer = window.setInterval(() => {
        if (shown) {
          progress += (0.9 - progress) * 0.1;
          paint(progress);
        }
        check();
      }, TRICKLE_MS);
      safetyTimer = window.setTimeout(finish, SAFETY_MS);

      const main = document.getElementById("admin-main");
      if (main) {
        observer = new MutationObserver(check);
        observer.observe(main, { childList: true, subtree: true });
      }
    };

    const onClick = (e: MouseEvent) => {
      if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const anchor = e.target instanceof Element ? e.target.closest("a[href]") : null;
      if (!(anchor instanceof HTMLAnchorElement)) return;
      if ((anchor.target && anchor.target !== "_self") || anchor.hasAttribute("download")) return;
      const next = adminTarget(anchor.href);
      if (next) start(next);
    };

    const onStartEvent = (e: Event) => {
      const next = adminTarget((e as CustomEvent<string>).detail);
      if (next) start(next);
    };

    // Back / forward mid-navigation: follow wherever the history went.
    const onPopState = () => {
      if (target === null) return;
      target = currentUrl();
      check();
    };

    checkRef.current = check;
    // Capture phase: Next's <Link> calls preventDefault() on the way up.
    document.addEventListener("click", onClick, true);
    window.addEventListener(START_EVENT, onStartEvent);
    window.addEventListener("popstate", onPopState);
    return () => {
      document.removeEventListener("click", onClick, true);
      window.removeEventListener(START_EVENT, onStartEvent);
      window.removeEventListener("popstate", onPopState);
      stopRun();
      window.clearTimeout(hideTimer);
    };
  }, []);

  // The router committed a new address — maybe the one being waited for.
  useEffect(() => {
    checkRef.current();
  }, [pathname, searchParams]);

  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-x-0 top-[env(safe-area-inset-top)] z-[60] h-[3px]"
    >
      <div
        ref={barRef}
        className="absolute inset-y-0 right-0 w-0 rounded-l-full bg-gradient-to-l from-brand-deep via-brand-rubine to-[#E0262C] opacity-0 shadow-[0_0_8px_rgba(204,12,12,0.55)] transition-[width,opacity] duration-300 ease-out"
      >
        {/* glowing leading tip — the left end, since the bar grows leftward */}
        <span className="absolute -left-1 top-1/2 h-1.5 w-1.5 -translate-y-1/2 rounded-full bg-[#FF4A4A] shadow-[0_0_10px_3px_rgba(255,64,64,0.6)]" />
      </div>
    </div>
  );
}
