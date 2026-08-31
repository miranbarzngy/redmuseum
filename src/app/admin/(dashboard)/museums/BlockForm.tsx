"use client";

import { LanguageProvider, LanguageTabs } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
import { ImageField } from "../../_components/ImageField";
import { ImageGalleryField } from "../../_components/ImageGalleryField";
import { Panel } from "../../_components/Panel";
import { SaveBar } from "../../_components/SaveBar";
import type { BiographyBlockRow } from "@/lib/supabase/database.types";

export function BlockForm({
  action,
  block,
}: {
  action: (formData: FormData) => Promise<void>;
  block?: BiographyBlockRow;
}) {
  // Additional photos only — the cover (image_url) is never part of this list.
  const extraPhotos = (block?.image_urls ?? []).filter((url) => url && url !== block?.image_url);

  return (
    <LanguageProvider>
      <form action={action} className="flex flex-col gap-5">
        <Panel bodyClassName="flex flex-col gap-8">
          <div className="flex items-center justify-between gap-3">
            <span className="font-kurdish text-fluid-xs font-medium text-ink-faint">زمانی دەق</span>
            <LanguageTabs />
          </div>

          <LocalizedField
            name="title"
            label="ناوی بەش"
            defaults={{ ku: block?.title_ku, en: block?.title_en, ar: block?.title_ar }}
          />

          <ImageField
            label="وێنەی سەرەکی — ڕێژەی ١٦:٩"
            name="main_image_file"
            keptName="main_image_url_kept"
            currentUrl={block?.image_url}
            removable
            previewClassName="aspect-video w-80 object-contain"
            hint="وەک وێنەی سەرەکی لە لیستی بەشەکاندا و لە سەرەی پەڕەی بەشەکەدا پیشان دەدرێت. باشترین ئەنجام لەگەڵ ڕێژەی ١٦:٩ (بۆ نموونە ١٩٢٠×١٠٨٠ پیکسڵ) — وێنەکە بە تەواوی پیشان دەدرێت و ناکرێتەوە."
          />

          <ImageGalleryField
            label="وێنەی زیاتر — ڕێژەی ١٦:٩"
            name="image_gallery_files"
            keptName="image_urls_kept"
            currentUrls={extraPhotos}
            previewClassName="aspect-video w-40 object-contain"
            hint="لە پەڕەی بەشەکەدا لەژێر وێنەی سەرەکی بە تۆڕێک پیشان دەدرێن. ڕێژەی ١٦:٩ پێشنیارکراوە. × لەسەر وێنەیەک بۆ سڕینەوەی. وێنە نوێیەکان زیاد دەکرێن بۆ سەر ئەوانەی ماونەتەوە."
          />

          <LocalizedField
            name="body"
            label="پەراگراف"
            multiline
            required
            defaults={{ ku: block?.body_ku, en: block?.body_en, ar: block?.body_ar }}
          />
        </Panel>

        <SaveBar label={block ? "پاشەکەوتکردنی گۆڕانکارییەکان" : "زیادکردنی بەش"} />
      </form>
    </LanguageProvider>
  );
}
