"use client";

import { Field } from "../../_components/Field";
import { ImageField } from "../../_components/ImageField";
import { Toggle } from "../../_components/Toggle";
import { Panel } from "../../_components/Panel";
import { SaveBar } from "../../_components/SaveBar";
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
  return (
    <form action={action} className="flex flex-col gap-5">
      <Panel bodyClassName="flex flex-col gap-8">
        <ImageField
          label="وێنە"
          name="image_file"
          required={!item}
          currentUrl={item?.image_url}
          previewClassName="h-36 w-64 object-cover"
          hint={item ? "بەتاڵی بهێڵەرەوە بۆ پاراستنی وێنەی ئێستا." : undefined}
        />

        <div className="grid gap-6 sm:grid-cols-2">
          <Field
            label="جۆر"
            name="category_id"
            select
            required
            defaultValue={item?.category_id ?? categories[0]?.id ?? ""}
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label_ku}
              </option>
            ))}
          </Field>

          <Field label="ناونیشان (ئارەزوومەندانە)" name="title" defaultValue={item?.title ?? ""} />
        </div>

        <label className="flex items-center gap-3">
          <Toggle name="is_active" defaultChecked={item?.is_active ?? true} />
          <span className="font-kurdish text-fluid-sm font-medium text-ink">
            چالاک بێت (لە ماڵپەڕی گشتیدا پیشان بدرێت)
          </span>
        </label>
      </Panel>

      <SaveBar label={item ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی وێنە"} />
    </form>
  );
}
