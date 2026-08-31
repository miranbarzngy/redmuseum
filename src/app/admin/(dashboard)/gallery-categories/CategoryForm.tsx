"use client";

import { LanguageProvider, LanguageTabs } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
import { Field } from "../../_components/Field";
import { Panel } from "../../_components/Panel";
import { SaveBar } from "../../_components/SaveBar";
import type { GalleryCategoryRow } from "@/lib/supabase/database.types";

export function CategoryForm({
  action,
  category,
}: {
  action: (formData: FormData) => Promise<void>;
  category?: GalleryCategoryRow;
}) {
  return (
    <LanguageProvider>
      <form action={action} className="flex flex-col gap-5">
        <Panel bodyClassName="flex flex-col gap-8">
          <Field
            label="سلاگ (بۆ بەکارهێنانی داخلی)"
            name="slug"
            required
            defaultValue={category?.slug ?? ""}
            placeholder="بۆ نموونە: activity"
            dir="ltr"
            className="max-w-xs"
          />

          <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-6">
            <span className="font-kurdish text-fluid-xs font-medium text-ink-faint">زمانی ناونیشان</span>
            <LanguageTabs />
          </div>

          <LocalizedField
            name="label"
            label="ناونیشان"
            required
            hint="هەر سێ زمانەکە پێویستن."
            defaults={{ ku: category?.label_ku, en: category?.label_en, ar: category?.label_ar }}
          />
        </Panel>

        <SaveBar label={category ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی پۆل"} />
      </form>
    </LanguageProvider>
  );
}
