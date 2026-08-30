"use client";

import { useState } from "react";
import { LocalizedField } from "../../_components/LocalizedField";
import { SubmitButton } from "../../_components/SubmitButton";
import type { BiographyBlockRow } from "@/lib/supabase/database.types";

export function BlockForm({
  action,
  block,
}: {
  action: (formData: FormData) => Promise<void>;
  block?: BiographyBlockRow;
}) {
  // Prefer the ordered gallery; fall back to the legacy single image_url for
  // rows saved before the gallery column existed.
  const initialGallery =
    block?.image_urls && block.image_urls.length > 0
      ? block.image_urls
      : block?.image_url
        ? [block.image_url]
        : [];
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [newFiles, setNewFiles] = useState<{ url: string; file: File }[]>([]);

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
          وێنەکانی ئەم بەشە
        </legend>

        {(gallery.length > 0 || newFiles.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {gallery.map((url, i) => (
              <div key={url} className="relative h-32 w-32">
                {/* eslint-disable-next-line @next/next/no-img-element -- external/blob previews aren't eligible for next/image optimization */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full rounded-xl border border-ink/10 bg-canvas-paper object-cover"
                />
                <input type="hidden" name="image_urls_kept" value={url} />
                {i === 0 && (
                  <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-medium text-canvas">
                    سەرەکی
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => setGallery((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-fluid-xs text-canvas shadow-card"
                  aria-label="سڕینەوە"
                >
                  ×
                </button>
              </div>
            ))}
            {newFiles.map(({ url }) => (
              // eslint-disable-next-line @next/next/no-img-element -- local blob previews aren't eligible for next/image optimization
              <img
                key={url}
                src={url}
                alt=""
                className="h-32 w-32 rounded-xl border border-dashed border-ink/20 bg-canvas-paper object-cover"
              />
            ))}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs text-ink-faint">
            زیادکردنی وێنە (دەتوانیت چەند وێنەیەک هەڵبژێریت)
          </span>
          <input
            type="file"
            name="image_gallery_files"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setNewFiles(files.map((file) => ({ url: URL.createObjectURL(file), file })));
            }}
            className="rounded-xl border border-dashed border-ink/20 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-fluid-xs file:font-medium file:text-canvas"
          />
        </label>

        <p className="text-fluid-xs text-ink-faint">
          یەکەم وێنە وەک وێنەی سەرەکی لە لیستی بەشەکاندا پیشان دەدرێت؛ هەموو وێنەکان لە پەڕەی بەشەکەدا
          دەردەکەون. × لەسەر وێنەیەک لێبدە بۆ سڕینەوەی. وێنە نوێیەکان زیاد دەکرێن بۆ سەر ئەوانەی ماونەتەوە.
        </p>
      </fieldset>

      <label className="flex max-w-xs flex-col gap-1.5">
        <span className="text-fluid-xs font-medium text-ink-soft">ڕیزبەندی</span>
        <input
          type="number"
          name="sort_order"
          defaultValue={block?.sort_order ?? 0}
          className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
        />
        <span className="text-fluid-xs text-ink-faint">ژمارە بچووکەکان یەکەم دەردەکەون.</span>
      </label>

      <LocalizedField
        name="body"
        label="پەراگراف"
        multiline
        required
        defaults={{ ku: block?.body_ku, en: block?.body_en, ar: block?.body_ar }}
      />

      <div>
        <SubmitButton>{block ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی بەش"}</SubmitButton>
      </div>
    </form>
  );
}
