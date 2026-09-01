"use client";

import { useSyncExternalStore } from "react";
import { Capacitor } from "@capacitor/core";

// Nothing to subscribe to — `Capacitor.isNativePlatform()` is fixed for the
// lifetime of the page — so the subscribe callback is an inert no-op.
const noopSubscribe = () => () => {};

/**
 * True only when the page is running inside the installed native Capacitor
 * shell (the Android admin APK), false in every desktop or mobile browser.
 *
 * `useSyncExternalStore` hands the server render (and the first client render)
 * the `false` snapshot so hydration matches, then swaps in the real client
 * value on commit — no effect, no cascading re-render. Callers use it to
 * force the phone-style bottom nav in the APK regardless of viewport width:
 * an Android tablet's WebView reports a desktop-width viewport, so a CSS
 * media query alone would wrongly hand it the sidebar layout.
 */
export function useIsNativeApp(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => Capacitor.isNativePlatform(),
    () => false,
  );
}
