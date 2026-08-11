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
  const [preview, setPreview] = useState<string | null>(block?.image_url ?? null);

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
          وێنەی پۆرترێت
        </legend>

        {preview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: previews aren't eligible for next/image optimization
          <img
            src={preview}
            alt=""
            className="h-48 w-48 rounded-xl border border-ink/10 bg-canvas-paper object-contain"
          />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs text-ink-faint">بارکردنی فایلێک</span>
          <input
            type="file"
            name="image_file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setPreview(URL.createObjectURL(file));
            }}
            className="rounded-xl border border-dashed border-ink/20 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-fluid-xs file:font-medium file:text-canvas"
          />
        </label>

        <p className="text-fluid-xs text-ink-faint">بەتاڵی بهێڵەرەوە بۆ پاراستنی وێنەی ئێستا.</p>
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
