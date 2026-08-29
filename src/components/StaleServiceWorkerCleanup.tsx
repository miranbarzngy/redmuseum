"use client";

import { useEffect } from "react";

/**
 * This app has never shipped a service worker (no PWA/workbox package in
 * package.json, no sw.js in public/), but some visitors' browsers still
 * have one installed and controlling this origin from an earlier build —
 * one with a hardcoded CSP scoped to a now-unused Supabase project, which
 * silently blocks every image fetch against the current project. Since we
 * can't reach into an already-registered service worker from the server,
 * this unregisters it (and clears its caches) client-side on first load,
 * then reloads once so the page is served fresh with no worker in control.
 */
export function StaleServiceWorkerCleanup() {
  useEffect(() => {
    if (!("serviceWorker" in navigator)) return;

    const RELOAD_FLAG = "sw-cleanup-reloaded";

    async function cleanup() {
      const registrations = await navigator.serviceWorker.getRegistrations();
      if (registrations.length === 0) return;

      await Promise.all(registrations.map((r) => r.unregister()));
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }

      // Reload once so this load (which may already be served/intercepted
      // by the worker we just unregistered) gets a clean, unintercepted
      // pass — guarded by sessionStorage so a persistent failure elsewhere
      // can't loop the reload forever.
      if (!sessionStorage.getItem(RELOAD_FLAG)) {
        sessionStorage.setItem(RELOAD_FLAG, "1");
        window.location.reload();
      }
    }

    cleanup().catch(() => {
      // Best-effort cleanup — nothing else to do if it fails.
    });
  }, []);

  return null;
}
