"use client";

import { LanguageProvider, LanguageTabs } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
import { Field } from "../../_components/Field";
import { Panel } from "../../_components/Panel";
import { SaveBar } from "../../_components/SaveBar";
import type { ExhibitionRow } from "@/lib/supabase/database.types";

export function ExhibitionForm({
  action,
  exhibition,
}: {
  action: (formData: FormData) => Promise<void>;
  exhibition?: ExhibitionRow;
}) {
  return (
    <LanguageProvider>
      <form action={action} className="flex flex-col gap-5">
        <Panel bodyClassName="flex flex-col gap-8">
          <Field
            label="ساڵ"
            name="year"
            required
            defaultValue={exhibition?.year ?? ""}
            placeholder="بۆ نموونە: ٢٠١٩ یان ٢٠١٩-٢٠٢٠"
            dir="rtl"
            className="max-w-xs"
          />

          <div className="flex items-center justify-between gap-3 border-t border-ink/10 pt-6">
            <span className="font-kurdish text-fluid-xs font-medium text-ink-faint">زمانی دەق</span>
            <LanguageTabs />
          </div>

          <LocalizedField
            name="title"
            label="ناونیشان"
            required
            hint="هەر سێ زمانەکە پێویستن."
            defaults={{ ku: exhibition?.title_ku, en: exhibition?.title_en, ar: exhibition?.title_ar }}
          />

          <LocalizedField
            name="details"
            label="وردەکاری"
            multiline
            resizable
            defaults={{ ku: exhibition?.details_ku, en: exhibition?.details_en, ar: exhibition?.details_ar }}
          />
        </Panel>

        <SaveBar label={exhibition ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی ڕووداو"} />
      </form>
    </LanguageProvider>
  );
}
