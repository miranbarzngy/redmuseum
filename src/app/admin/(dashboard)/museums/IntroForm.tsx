"use client";

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
    <form action={action} className="flex flex-col gap-8">
      <LocalizedField
        name="eyebrow"
        label="دەربڕینی بچووک (خشتەیەکی بچووک لەسەر ناونیشان)"
        defaults={{ ku: intro?.eyebrow_ku ?? "", en: intro?.eyebrow_en ?? "", ar: intro?.eyebrow_ar ?? "" }}
      />

      <LocalizedField
        name="heading"
        label="ناونیشان"
        defaults={{ ku: intro?.heading_ku ?? "", en: intro?.heading_en ?? "", ar: intro?.heading_ar ?? "" }}
      />

      <LocalizedField
        name="intro"
        label="پەراگرافی سەرەتا"
        multiline
        defaults={{ ku: intro?.intro_ku ?? "", en: intro?.intro_en ?? "", ar: intro?.intro_ar ?? "" }}
      />

      <p className="text-fluid-xs text-ink-faint">
        هەر خانەیەک بەتاڵ بهێڵەرەوە بۆ گەڕانەوە بۆ دەقی بنەڕەتی ماڵپەڕ بۆ ئەو زمانە.
      </p>

      <div>
        <SubmitButton>پاشەکەوتکردنی گۆڕانکارییەکان</SubmitButton>
      </div>
    </form>
  );
}
