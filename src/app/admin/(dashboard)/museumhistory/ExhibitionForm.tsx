"use client";

import { LanguageProvider, LanguageTabs } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
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
          <div className="flex items-center justify-between gap-3">
            <span className="font-kurdish text-fluid-xs font-medium text-ink-faint">زمانی دەق</span>
            <LanguageTabs />
          </div>

          <LocalizedField
            name="year"
            label="ساڵ"
            required
            hint="بۆ نموونە: ٢٠١٩ یان ٢٠١٩-٢٠٢٠ — هەر سێ زمانەکە پێویستن."
            defaults={{ ku: exhibition?.year_ku, en: exhibition?.year_en, ar: exhibition?.year_ar }}
          />

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
