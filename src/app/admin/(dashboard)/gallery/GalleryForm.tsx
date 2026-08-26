"use client";

import { useState } from "react";
import { SubmitButton } from "../../_components/SubmitButton";
import type { GalleryRow, GalleryCategoryRow } from "@/lib/supabase/database.types";

export function GalleryForm({
  action,
  item,
  categories,
}: {
  action: (formData: FormData) => Promise<void>;
  item?: GalleryRow;
  categories: GalleryCategoryRow[];
}) {
  const [preview, setPreview] = useState<string | null>(item?.image_url ?? null);

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">وێنە</legend>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: previews aren't eligible for next/image optimization
          <img
            src={preview}
            alt=""
            className="aspect-video w-full max-w-sm rounded-xl border border-ink/10 bg-canvas-paper object-cover"
          />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs text-ink-faint">بارکردنی فایلێک</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            required={!item}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            className="rounded-xl border border-dashed border-ink/20 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-fluid-xs file:font-medium file:text-canvas"
          />
        </label>

        {item && <p className="text-fluid-xs text-ink-faint">بەتاڵی بهێڵەرەوە بۆ پاراستنی وێنەی ئێستا.</p>}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs font-medium text-ink-soft">جۆر</span>
          <select
            name="category_id"
            required
            defaultValue={item?.category_id ?? categories[0]?.id ?? ""}
            className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label_ku}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs font-medium text-ink-soft">ڕیزبەندی پیشاندان</span>
          <input
            type="number"
            name="display_order"
            defaultValue={item?.display_order ?? 0}
            className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
          />
        </label>

        <label className="flex flex-col gap-1.5 sm:col-span-2">
          <span className="text-fluid-xs font-medium text-ink-soft">ناونیشان (ئارەزوومەندانە)</span>
          <input
            type="text"
            name="title"
            defaultValue={item?.title ?? ""}
            className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
          />
        </label>
      </div>

      <label className="font-kurdish flex items-center gap-3 text-fluid-sm font-medium text-ink">
        <input
          type="checkbox"
          name="is_active"
          defaultChecked={item?.is_active ?? true}
          className="h-5 w-5 rounded border-ink/20 accent-pigment-terracotta"
        />
        چالاک بێت (لە ماڵپەڕی گشتیدا پیشان بدرێت)
      </label>

      <div>
        <SubmitButton>{item ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی وێنە"}</SubmitButton>
      </div>
    </form>
  );
}
