"use client";

import { useEffect, useState } from "react";

/**
 * Seconds left of a login cooldown, ticking down to 0. Counts against a
 * deadline rather than decrementing, so a throttled background tab doesn't
 * drift. Starts from `seconds` on both server and client (no hydration
 * mismatch); the page keys these components on the cooldown's end so a
 * new cooldown remounts them instead of reusing the old count.
 */
function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);

  useEffect(() => {
    if (seconds <= 0) return;
    const deadline = Date.now() + seconds * 1000;
    const id = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((deadline - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining === 0) clearInterval(id);
    }, 250);
    return () => clearInterval(id);
  }, [seconds]);

  return left;
}

/** m:ss with plain ASCII digits (see the admin layout's font unicode-range). */
function formatCountdown(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

/** `seconds` is null when the end of the cooldown couldn't be worked out. */
export function CooldownNotice({ seconds }: { seconds: number | null }) {
  const left = useCountdown(seconds ?? 0);

  if (seconds !== null && left === 0) {
    return (
      <p className="mt-4 rounded-lg bg-pigment-teal/15 px-3 py-2 text-fluid-xs text-pigment-teal">
        ئێستا دەتوانیت دووبارە هەوڵ بدەیتەوە.
      </p>
    );
  }

  return (
    <div className="mt-4 rounded-lg bg-pigment-crimson/10 px-3 py-2 text-fluid-xs text-pigment-crimson">
      <p>
        تکایە کەمێک چاوەڕێ بکە و دووبارە هەوڵ بدەوە (هەوڵێک لە خولەکێکدا، و دوای 5 هەوڵی هەڵە بۆ 15 خولەک ڕادەگیرێت).
      </p>
      {seconds !== null && (
        <p className="mt-2 flex items-center gap-2 font-semibold">
          <span>کاتی ماوە:</span>
          <span dir="ltr" className="text-fluid-base tabular-nums" role="timer" aria-live="off">
            {formatCountdown(left)}
          </span>
        </p>
      )}
    </div>
  );
}

export function LoginSubmitButton({ cooldownSeconds }: { cooldownSeconds: number }) {
  const left = useCountdown(cooldownSeconds);

  return (
    <button
      type="submit"
      disabled={left > 0}
      className="mt-2 rounded-full bg-[#850B10] px-4 py-3.5 text-fluid-base font-medium text-canvas transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#6a090d] hover:shadow-soft active:translate-y-0 active:scale-95 disabled:cursor-not-allowed disabled:translate-y-0 disabled:scale-100 disabled:opacity-60 disabled:shadow-none"
    >
      چوونەژوورەوە
    </button>
  );
}
