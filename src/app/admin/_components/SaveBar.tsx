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
 *
 * On phones it's just the save button, full width and floating on its own
 * shadow like a native screen's bottom call-to-action; from `sm` up it sits
 * in a frosted card, right-aligned.
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
        "sticky z-20 flex flex-wrap items-center justify-end gap-3 rounded-2xl",
        "sm:border sm:border-ink/10 sm:bg-white/90 sm:px-4 sm:py-3 sm:shadow-card sm:backdrop-blur-md",
        "bottom-[calc(env(safe-area-inset-bottom)+7rem)]",
        !forceBottomNav && "lg:bottom-3",
      )}
    >
      {children}
      <SubmitButton className="w-full shadow-[0_14px_30px_-10px_rgba(133,11,16,0.55)] sm:w-auto sm:shadow-none">
        {label}
      </SubmitButton>
    </div>
  );
}
