"use client";

import { LanguageProvider, LanguageTabs } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
import { SubmitButton } from "../../_components/SubmitButton";
import type { BiographyIntroRow } from "@/lib/supabase/database.types";

export function IntroForm({
  action,
  intro,
}: {
  action: (formData: FormData) => Promise<void>;
  intro: BiographyIntroRow | null;
}) {
  return (
    <LanguageProvider>
      <form action={action} className="flex flex-col gap-6">
        <div className="flex items-center justify-between gap-3">
          <span className="font-kurdish text-fluid-xs font-medium text-ink-faint">زمانی دەق</span>
          <LanguageTabs />
        </div>

        <LocalizedField
          name="intro"
          label="پەراگرافی سەرەتا"
          multiline
          defaults={{ ku: intro?.intro_ku ?? "", en: intro?.intro_en ?? "", ar: intro?.intro_ar ?? "" }}
          hint="هەر خانەیەک بەتاڵ بهێڵەرەوە بۆ گەڕانەوە بۆ دەقی بنەڕەتی ماڵپەڕ بۆ ئەو زمانە."
        />

        <div>
          <SubmitButton>پاشەکەوتکردنی گۆڕانکارییەکان</SubmitButton>
        </div>
      </form>
    </LanguageProvider>
  );
}
