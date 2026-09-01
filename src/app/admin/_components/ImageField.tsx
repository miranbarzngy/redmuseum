"use client";

import { useState } from "react";
import clsx from "clsx";
import { Plus } from "lucide-react";

/** A dashed "+" tile that opens the file picker — the visible stand-in for a
 * raw <input type="file">. The real input stays mounted (screen-reader-only)
 * so form submission, `required`, and a pending file selection all survive the
 * tile ↔ "change photo" swap that <ImageField> does when a preview appears.
 *
 * `sizeClassName` is the same value the thumbnails get as `previewClassName`,
 * so the tile lines up with them in a grid; any `object-*` in it is inert here. */
export function AddPhotoTile({
  name,
  onChange,
  sizeClassName,
  caption = "زیادکردنی وێنە",
  multiple = false,
  required = false,
  compact = false,
}: {
  name: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  sizeClassName?: string;
  caption?: string;
  multiple?: boolean;
  required?: boolean;
  /** Render as a small pill instead of a full tile — used once an image is
   * already previewed and the input's only job is "replace it". */
  compact?: boolean;
}) {
  return (
    <label
      className={clsx(
        "group cursor-pointer border-dashed border-ink/25 text-ink-soft transition",
        "hover:border-ink/45 hover:bg-canvas-paper",
        "focus-within:border-ink/45 focus-within:ring-2 focus-within:ring-ink/15",
        compact
          ? "font-kurdish inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-fluid-xs"
          : clsx(
              "flex flex-col items-center justify-center gap-1.5 rounded-xl border bg-canvas-paper/60 p-1.5 text-center",
              sizeClassName
            )
      )}
    >
      {compact ? (
        <>
          <Plus size={13} />
          <span>{caption}</span>
        </>
      ) : (
        <>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ink/5 text-ink-soft transition group-hover:bg-ink/10">
            <Plus size={16} />
          </span>
          <span className="font-kurdish text-fluid-xs leading-tight text-ink-faint">{caption}</span>
        </>
      )}
      <input
        type="file"
        name={name}
        accept="image/*"
        multiple={multiple}
        required={required}
        onChange={onChange}
        className="sr-only"
      />
    </label>
  );
}

/** Single image: preview + "+" tile, optionally removable, optionally carrying
 * the current URL in a hidden `keptName` input so the server action can tell
 * "keep" from "cleared". */
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

      {/* One AddPhotoTile, always mounted: swapping `compact` keeps the same
          <input> element, so a file picked before the preview renders isn't lost. */}
      <AddPhotoTile
        name={name}
        required={required}
        compact={!!preview}
        caption={preview ? "گۆڕینی وێنە" : "زیادکردنی وێنە"}
        sizeClassName={previewClassName}
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            setPreview(URL.createObjectURL(file));
            setKept(null);
          }
        }}
      />

      {hint && <p className="font-kurdish text-fluid-xs text-ink-faint">{hint}</p>}
    </fieldset>
  );
}
