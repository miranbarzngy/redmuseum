"use client";

import { useState } from "react";
import clsx from "clsx";

export const fileInputClass =
  "rounded-xl border border-dashed border-ink/20 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-fluid-xs file:font-medium file:text-canvas";

/** Single image: preview + file input, optionally removable, optionally
 * carrying the current URL in a hidden `keptName` input so the server action
 * can tell "keep" from "cleared". */
export function ImageField({
  label,
  name,
  keptName,
  currentUrl,
  hint,
  required,
  removable = false,
  previewClassName = "h-40 w-40 object-contain",
}: {
  label: string;
  name: string;
  keptName?: string;
  currentUrl?: string | null;
  hint?: string;
  required?: boolean;
  removable?: boolean;
  previewClassName?: string;
}) {
  const [preview, setPreview] = useState<string | null>(currentUrl ?? null);
  const [kept, setKept] = useState<string | null>(currentUrl ?? null);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-kurdish text-fluid-xs font-medium text-ink-soft">{label}</legend>

      {preview && (
        <div className="relative w-fit max-w-full">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob/remote previews aren't next/image-eligible */}
          <img
            src={preview}
            alt=""
            className={clsx("rounded-xl border border-ink/10 bg-canvas-paper", previewClassName)}
          />
          {removable && (
            <button
              type="button"
              onClick={() => {
                setPreview(null);
                setKept(null);
              }}
              aria-label="سڕینەوە"
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-fluid-xs text-canvas shadow-card"
            >
              ×
            </button>
          )}
        </div>
      )}

      {keptName && kept && <input type="hidden" name={keptName} value={kept} />}

      <label className="flex flex-col gap-1.5">
        <span className="text-fluid-xs text-ink-faint">بارکردنی فایلێک</span>
        <input
          type="file"
          name={name}
          accept="image/*"
          required={required}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              setPreview(URL.createObjectURL(file));
              setKept(null);
            }
          }}
          className={fileInputClass}
        />
      </label>

      {hint && <p className="font-kurdish text-fluid-xs text-ink-faint">{hint}</p>}
    </fieldset>
  );
}
