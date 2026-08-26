"use client";

import { LocalizedField } from "../../_components/LocalizedField";
import { SubmitButton } from "../../_components/SubmitButton";
import type { GalleryCategoryRow } from "@/lib/supabase/database.types";

export function CategoryForm({
  action,
  category,
}: {
  action: (formData: FormData) => Promise<void>;
  category?: GalleryCategoryRow;
}) {
  return (
    <form action={action} className="flex flex-col gap-8">
      <div className="grid gap-6 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs font-medium text-ink-soft">سلاگ (بۆ بەکارهێنانی داخلی)</span>
          <input
            type="text"
            name="slug"
            required
            placeholder="بۆ نموونە: activity"
            defaultValue={category?.slug ?? ""}
            className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs font-medium text-ink-soft">ڕیزبەندی پیشاندان</span>
          <input
            type="number"
            name="sort_order"
            defaultValue={category?.sort_order ?? 0}
            className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
          />
        </label>
      </div>

      <LocalizedField
        name="label"
        label="ناونیشان"
        required
        defaults={{ ku: category?.label_ku, en: category?.label_en, ar: category?.label_ar }}
      />

      <div>
        <SubmitButton>{category ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی پۆل"}</SubmitButton>
      </div>
    </form>
  );
}
