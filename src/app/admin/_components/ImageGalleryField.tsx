"use client";

import { useState } from "react";
import clsx from "clsx";
import { fileInputClass } from "./ImageField";

/** Multi-image: a grid of kept photos (each removable, each backed by a
 * hidden `keptName` input) plus a `multiple` file input whose new selections
 * preview alongside. Matches the museum-block and hero-gallery inputs.
 *
 * `previewClassName` sets the size/fit of each thumbnail — default is a
 * cropped square; pass an `aspect-video … object-contain` value to show
 * whole 16:9 images. */
export function ImageGalleryField({
  label,
  name,
  keptName,
  currentUrls,
  hint,
  fileLabel = "زیادکردنی وێنە (دەتوانیت چەند وێنەیەک هەڵبژێریت)",
  previewClassName = "h-28 w-28 object-cover",
}: {
  label: string;
  name: string;
  keptName: string;
  currentUrls: string[];
  hint?: string;
  fileLabel?: string;
  previewClassName?: string;
}) {
  const [kept, setKept] = useState<string[]>(currentUrls);
  const [added, setAdded] = useState<string[]>([]);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-kurdish text-fluid-xs font-medium text-ink-soft">{label}</legend>

      {(kept.length > 0 || added.length > 0) && (
        <div className="flex flex-wrap gap-3">
          {kept.map((url, i) => (
            <div key={url} className="relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={url}
                alt=""
                className={clsx(
                  "rounded-xl border border-ink/10 bg-canvas-paper",
                  previewClassName
                )}
              />
              <input type="hidden" name={keptName} value={url} />
              <button
                type="button"
                onClick={() => setKept((prev) => prev.filter((_, idx) => idx !== i))}
                aria-label="سڕینەوە"
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-fluid-xs text-canvas shadow-card"
              >
                ×
              </button>
            </div>
          ))}
          {added.map((url) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={url}
              src={url}
              alt=""
              className={clsx(
                "rounded-xl border border-dashed border-ink/20 bg-canvas-paper",
                previewClassName
              )}
            />
          ))}
        </div>
      )}

      <label className="flex flex-col gap-1.5">
        <span className="text-fluid-xs text-ink-faint">{fileLabel}</span>
        <input
          type="file"
          name={name}
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setAdded(files.map((f) => URL.createObjectURL(f)));
          }}
          className={fileInputClass}
        />
      </label>

      {hint && <p className="font-kurdish text-fluid-xs text-ink-faint">{hint}</p>}
    </fieldset>
  );
}
