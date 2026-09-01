"use client";

import { useState } from "react";
import clsx from "clsx";
import { AddPhotoTile } from "./ImageField";
import { ConfirmDialog } from "./ConfirmDialog";

const REMOVE_CONFIRM = "سڕینەوەی ئەم وێنەیە؟ ناتوانرێت هەڵبوەشێندرێتەوە.";

/** Multi-image: a grid of kept photos (each removable, each backed by a
 * hidden `keptName` input) plus a trailing "+" tile whose `multiple` file
 * input previews new selections alongside. Matches the museum-block and
 * hero-gallery inputs.
 *
 * `previewClassName` sets the size/fit of each thumbnail — and of the tile —
 * default is a cropped square; pass an `aspect-video … object-contain` value
 * to show whole 16:9 images. */
export function ImageGalleryField({
  label,
  name,
  keptName,
  currentUrls,
  hint,
  fileLabel = "زیادکردنی وێنە",
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
  const [pendingRemove, setPendingRemove] = useState<number | null>(null);

  return (
    <fieldset className="flex flex-col gap-3">
      <legend className="font-kurdish text-fluid-xs font-medium text-ink-soft">{label}</legend>

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
              onClick={() => setPendingRemove(i)}
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

        {/* Trailing tile stays at a stable position, so its `multiple` input
            keeps a pending selection even as previews render before it. */}
        <AddPhotoTile
          name={name}
          multiple
          caption={fileLabel}
          sizeClassName={previewClassName}
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            setAdded(files.map((f) => URL.createObjectURL(f)));
          }}
        />
      </div>

      {hint && <p className="font-kurdish text-fluid-xs text-ink-faint">{hint}</p>}

      <ConfirmDialog
        open={pendingRemove !== null}
        message={REMOVE_CONFIRM}
        onCancel={() => setPendingRemove(null)}
        onConfirm={() => {
          setKept((prev) => prev.filter((_, idx) => idx !== pendingRemove));
          setPendingRemove(null);
        }}
      />
    </fieldset>
  );
}
