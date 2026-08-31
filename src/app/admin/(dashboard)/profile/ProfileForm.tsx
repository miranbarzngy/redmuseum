"use client";

import { LanguageProvider, LanguageTabs } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
import { Field } from "../../_components/Field";
import { ImageField } from "../../_components/ImageField";
import { ImageGalleryField } from "../../_components/ImageGalleryField";
import { Panel } from "../../_components/Panel";
import { SaveBar } from "../../_components/SaveBar";
import type { SiteProfileRow } from "@/lib/supabase/database.types";
import type { heroDefaults } from "@/lib/heroDefaults";

function withFallback(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export function ProfileForm({
  action,
  profile,
  homepageDefaults,
}: {
  action: (formData: FormData) => Promise<void>;
  profile: SiteProfileRow | null;
  homepageDefaults: typeof heroDefaults;
}) {
  const initialGallery =
    profile?.hero_image_urls && profile.hero_image_urls.length > 0
      ? profile.hero_image_urls
      : profile?.hero_image_url
        ? [profile.hero_image_url]
        : [];

  return (
    <LanguageProvider>
      <form action={action} className="flex flex-col gap-5">
        <Panel title="وێنەکان" bodyClassName="flex flex-col gap-8">
          <ImageGalleryField
            label="وێنەی پۆرترێتی پەڕەی سەرەکی"
            name="hero_image_gallery_files"
            keptName="hero_image_urls_kept"
            currentUrls={initialGallery}
            fileLabel="زیادکردنی وێنە (چەند وێنە بۆ گۆڕانی خۆکار هەر ٦ چرکە)"
            hint="× لەسەر وێنەیەک بۆ سڕینەوەی. وێنە نوێیەکان زیاد دەکرێن بۆ سەر ئەوانەی ماونەتەوە."
          />

          <ImageField
            label="وێنەی کارتی پەیوەندی (بەشی «بەشی»)"
            name="contact_card_image_file"
            currentUrl={profile?.contact_card_image_url}
            previewClassName="h-44 w-44 object-cover"
            hint="کاتێک دابنرێت، لە جێی کارتی ستۆدیۆ و پەیوەندیی ڕەشدا پیشان دەدرێت. بەتاڵی بهێڵەرەوە بۆ کارتی بنەڕەتی."
          />
        </Panel>

        <Panel title="دەقەکان" action={<LanguageTabs />} bodyClassName="flex flex-col gap-8">
          <LocalizedField
            name="eyebrow"
            label="دەربڕینی بچووک (خشتەیەکی بچووک لەسەر ناو)"
            defaults={{
              ku: withFallback(profile?.eyebrow_ku, homepageDefaults.eyebrow.ku),
              en: withFallback(profile?.eyebrow_en, homepageDefaults.eyebrow.en),
              ar: withFallback(profile?.eyebrow_ar, homepageDefaults.eyebrow.ar),
            }}
          />
          <LocalizedField
            name="name"
            label="ناو"
            defaults={{
              ku: withFallback(profile?.name_ku, homepageDefaults.name.ku),
              en: withFallback(profile?.name_en, homepageDefaults.name.en),
              ar: withFallback(profile?.name_ar, homepageDefaults.name.ar),
            }}
          />
          <LocalizedField
            name="statement"
            label="دەربارە / دەربڕین"
            multiline
            resizable
            defaults={{
              ku: withFallback(profile?.statement_ku, homepageDefaults.statement.ku),
              en: withFallback(profile?.statement_en, homepageDefaults.statement.en),
              ar: withFallback(profile?.statement_ar, homepageDefaults.statement.ar),
            }}
          />
        </Panel>

        <Panel title="ئامارەکانی لای لۆگۆ" bodyClassName="flex flex-col gap-4">
          <StatFieldPair
            nameBase="stat_museums"
            title="مۆزەکان"
            value={withFallback(profile?.stat_museums_value, "١١")}
            label={withFallback(profile?.stat_museums_label, "مۆزە")}
          />
          <StatFieldPair
            nameBase="stat_archive"
            title="ئەرشیف"
            value={withFallback(profile?.stat_archive_value, "١,٨٩٨")}
            label={withFallback(profile?.stat_archive_label, "پارچە ئەرشیف")}
          />
          <StatFieldPair
            nameBase="stat_activities"
            title="چالاکییەکان"
            value={withFallback(profile?.stat_activities_value, "+٥٠")}
            label={withFallback(profile?.stat_activities_label, "چالاکی ساڵانە")}
          />
          <StatFieldPair
            nameBase="stat_visitors"
            title="سەردانیکەران"
            value={withFallback(profile?.stat_visitors_value, "٢٠,٠٠٠")}
            label={withFallback(profile?.stat_visitors_label, "سەردانیکەر ساڵانە")}
          />
        </Panel>

        <SaveBar />
      </form>
    </LanguageProvider>
  );
}

function StatFieldPair({
  nameBase,
  title,
  value,
  label,
}: {
  nameBase: string;
  title: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink/10 p-4">
      <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">{title}</span>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="ژمارە" name={`${nameBase}_value`} defaultValue={value} dir="rtl" />
        <Field label="ناونیشان" name={`${nameBase}_label`} defaultValue={label} dir="rtl" />
      </div>
    </div>
  );
}
