"use client";

import { useState, type ChangeEvent } from "react";
import { Eye, EyeOff } from "lucide-react";

// Kurdish/Arabic/Persian keyboards commonly type Eastern Arabic-Indic
// (٠-٩) or Extended Arabic-Indic (۰-۹) digits by default — but the actual
// admin password is plain ASCII, so those need converting back or the
// password silently never matches.
function toAsciiDigits(value: string): string {
  return value.replace(/[٠-٩۰-۹]/g, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code <= 0x0669 ? 0x0660 : 0x06f0;
    return String(code - base);
  });
}

export function PasswordField() {
  const [visible, setVisible] = useState(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const converted = toAsciiDigits(e.target.value);
    if (converted !== e.target.value) {
      e.target.value = converted;
    }
  };

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        name="password"
        required
        autoFocus
        autoComplete="current-password"
        lang="en"
        onChange={handleChange}
        className="w-full rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 pl-10 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? "شاردنەوەی وشەی نهێنی" : "پیشاندانی وشەی نهێنی"}
        className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-md p-1 text-ink-faint transition-colors hover:text-ink"
      >
        {visible ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
}
