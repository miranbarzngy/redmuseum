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
  const [mainPreview, setMainPreview] = useState<string | null>(block?.image_url ?? null);
  const [mainKept, setMainKept] = useState<string | null>(block?.image_url ?? null);

  // Additional photos only — the main/cover photo above is never part of
  // this list.
  const initialGallery = (block?.image_urls ?? []).filter(
    (url) => url && url !== block?.image_url
  );
  const [gallery, setGallery] = useState<string[]>(initialGallery);
  const [newFiles, setNewFiles] = useState<{ url: string; file: File }[]>([]);

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
          وێنەی سەرەکی
        </legend>

        {mainPreview && (
          <div className="relative h-48 w-48">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob: previews aren't eligible for next/image optimization */}
            <img
              src={mainPreview}
              alt=""
              className="h-full w-full rounded-xl border border-ink/10 bg-canvas-paper object-contain"
            />
            <button
              type="button"
              onClick={() => {
                setMainPreview(null);
                setMainKept(null);
              }}
              className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-fluid-xs text-canvas shadow-card"
              aria-label="سڕینەوە"
            >
              ×
            </button>
          </div>
        )}

        {/* Carries the current cover URL when no new file is chosen. */}
        {mainKept && <input type="hidden" name="main_image_url_kept" value={mainKept} />}

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs text-ink-faint">بارکردنی فایلێک</span>
          <input
            type="file"
            name="main_image_file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                setMainPreview(URL.createObjectURL(file));
                setMainKept(null);
              }
            }}
            className="rounded-xl border border-dashed border-ink/20 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-fluid-xs file:font-medium file:text-canvas"
          />
        </label>

        <p className="text-fluid-xs text-ink-faint">
          ئەم وێنەیە وەک وێنەی سەرەکی لە لیستی بەشەکاندا و لە سەرەی پەڕەی بەشەکەدا پیشان دەدرێت.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
          وێنەی زیاتر
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
          ئەم وێنانە لە پەڕەی بەشەکەدا لەژێر وێنەی سەرەکی بە شێوەی تۆڕێک پیشان دەدرێن. × لەسەر وێنەیەک
          لێبدە بۆ سڕینەوەی. وێنە نوێیەکان زیاد دەکرێن بۆ سەر ئەوانەی ماونەتەوە.
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
