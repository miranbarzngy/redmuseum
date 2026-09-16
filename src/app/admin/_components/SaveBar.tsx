"use client";

import clsx from "clsx";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { SubmitButton } from "./SubmitButton";

/**
 * Sticky action bar for long forms — pins the save button to the bottom of
 * the viewport so it's always reachable without scrolling to the end. Below
 * `lg` (and always in the native APK) the floating bottom nav is on screen,
 * so the bar sits well above it instead of at the old flush 0.75rem — see
 * AdminShell's own nav-vs-`forceBottomNav` split for the matching logic.
 * Place it as the last child inside the <form> (so its <SubmitButton>'s
 * useFormStatus still sees the form), after the panels.
 */
export function SaveBar({
  children,
  label = "پاشەکەوتکردنی گۆڕانکارییەکان",
}: {
  children?: React.ReactNode;
  label?: string;
}) {
  const forceBottomNav = useIsNativeApp();

  return (
    <div
      className={clsx(
        "sticky z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl border border-ink/10 bg-white/90 px-4 py-3 shadow-card backdrop-blur-md",
        "bottom-[calc(env(safe-area-inset-bottom)+7rem)]",
        !forceBottomNav && "lg:bottom-3",
      )}
    >
      {children}
      <SubmitButton>{label}</SubmitButton>
    </div>
  );
}
