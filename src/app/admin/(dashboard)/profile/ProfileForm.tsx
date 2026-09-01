"use client";

import { LanguageProvider, LanguageTabs } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
import { Field } from "../../_components/Field";
import { ImageField } from "../../_components/ImageField";
import { ImageGalleryField } from "../../_components/ImageGalleryField";
import { Panel } from "../../_components/Panel";
import { SaveBar } from "../../_components/SaveBar";
import { statDefaults } from "@/lib/statDefaults";
import type { SiteProfileRow } from "@/lib/supabase/database.types";
import type { heroDefaults } from "@/lib/heroDefaults";
import type { contactDefaults as contactDefaultsType } from "@/lib/contactDefaults";

function withFallback(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

export function ProfileForm({
  action,
  profile,
  homepageDefaults,
  contactDefaults,
}: {
  action: (formData: FormData) => Promise<void>;
  profile: SiteProfileRow | null;
  homepageDefaults: typeof heroDefaults;
  contactDefaults: typeof contactDefaultsType;
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
            fileLabel="زیادکردنی وێنە"
            hint="چەند وێنە زیاد بکە بۆ گۆڕانی خۆکار هەر ٦ چرکە. × لەسەر وێنەیەک بۆ سڕینەوەی. وێنە نوێیەکان زیاد دەکرێن بۆ سەر ئەوانەی ماونەتەوە."
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

        <Panel
          title="ئامارەکانی لای لۆگۆ"
          action={<LanguageTabs />}
          bodyClassName="flex flex-col gap-4"
        >
          <StatFieldPair
            nameBase="stat_museums"
            title="مۆزەکان"
            valueDefault={withFallback(profile?.stat_museums_value, statDefaults.museums.value)}
            labelDefaults={{
              ku: withFallback(profile?.stat_museums_label_ku, statDefaults.museums.label.ku),
              en: withFallback(profile?.stat_museums_label_en, statDefaults.museums.label.en),
              ar: withFallback(profile?.stat_museums_label_ar, statDefaults.museums.label.ar),
            }}
          />
          <StatFieldPair
            nameBase="stat_archive"
            title="ئەرشیف"
            valueDefault={withFallback(profile?.stat_archive_value, statDefaults.archive.value)}
            labelDefaults={{
              ku: withFallback(profile?.stat_archive_label_ku, statDefaults.archive.label.ku),
              en: withFallback(profile?.stat_archive_label_en, statDefaults.archive.label.en),
              ar: withFallback(profile?.stat_archive_label_ar, statDefaults.archive.label.ar),
            }}
          />
          <StatFieldPair
            nameBase="stat_activities"
            title="چالاکییەکان"
            valueDefault={withFallback(profile?.stat_activities_value, statDefaults.activities.value)}
            labelDefaults={{
              ku: withFallback(profile?.stat_activities_label_ku, statDefaults.activities.label.ku),
              en: withFallback(profile?.stat_activities_label_en, statDefaults.activities.label.en),
              ar: withFallback(profile?.stat_activities_label_ar, statDefaults.activities.label.ar),
            }}
          />
          <StatFieldPair
            nameBase="stat_visitors"
            title="سەردانیکەران"
            valueDefault={withFallback(profile?.stat_visitors_value, statDefaults.visitors.value)}
            labelDefaults={{
              ku: withFallback(profile?.stat_visitors_label_ku, statDefaults.visitors.label.ku),
              en: withFallback(profile?.stat_visitors_label_en, statDefaults.visitors.label.en),
              ar: withFallback(profile?.stat_visitors_label_ar, statDefaults.visitors.label.ar),
            }}
          />
        </Panel>

        <Panel
          title="پەیوەندی و لینکەکان"
          description="ئیمەیل، شوێن و لینکی تۆڕە کۆمەڵایەتییەکان لە کارتی «سەردان و پەیوەندی» و پێوانەی پەڕەکە."
          action={<LanguageTabs />}
          bodyClassName="flex flex-col gap-8"
        >
          <Field
            label="ئیمەیل"
            name="contact_email"
            type="text"
            dir="ltr"
            defaultValue={withFallback(profile?.contact_email, contactDefaults.email)}
            hint="ناونیشانی ئیمەیل کە لە کارتی پەیوەندیدا پیشان دەدرێت."
          />
          <LocalizedField
            name="contact_location"
            label="شوێن"
            defaults={{
              ku: withFallback(profile?.contact_location_ku, contactDefaults.location.ku),
              en: withFallback(profile?.contact_location_en, contactDefaults.location.en),
              ar: withFallback(profile?.contact_location_ar, contactDefaults.location.ar),
            }}
          />
          <Field
            label="لینکی نەخشە (شوێنی مۆزەخانەکە)"
            name="contact_map_url"
            type="text"
            dir="ltr"
            defaultValue={withFallback(profile?.contact_map_url, contactDefaults.mapUrl)}
            hint="بەتاڵی بهێڵەرەوە ئەگەر ناتەوێت شوێنەکە ببێتە لینک بۆ گووگڵ ماپس."
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="ئینستاگرام"
              name="social_instagram_url"
              type="text"
              dir="ltr"
              defaultValue={withFallback(
                profile?.social_instagram_url,
                contactDefaults.socials.instagram
              )}
            />
            <Field
              label="فەیسبووک"
              name="social_facebook_url"
              type="text"
              dir="ltr"
              defaultValue={withFallback(
                profile?.social_facebook_url,
                contactDefaults.socials.facebook
              )}
            />
            <Field
              label="ئێکس (تویتەر)"
              name="social_x_url"
              type="text"
              dir="ltr"
              defaultValue={withFallback(profile?.social_x_url, contactDefaults.socials.x)}
            />
            <Field
              label="یوتیوب"
              name="social_youtube_url"
              type="text"
              dir="ltr"
              defaultValue={withFallback(
                profile?.social_youtube_url,
                contactDefaults.socials.youtube
              )}
            />
          </div>
          <span className="font-kurdish text-fluid-xs text-ink-faint">
            هەر خانەیەک بەتاڵ بکەیتەوە، ئەو دوگمەیە لە ماڵپەڕەکە لادەبرێت.
          </span>
        </Panel>

        <SaveBar />
      </form>
    </LanguageProvider>
  );
}

function StatFieldPair({
  nameBase,
  title,
  valueDefault,
  labelDefaults,
}: {
  nameBase: string;
  title: string;
  valueDefault: string;
  labelDefaults: { ku: string; en: string; ar: string };
}) {
  return (
    <div className="flex flex-col gap-3 rounded-xl border border-ink/10 p-4">
      <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">{title}</span>
      <div className="grid gap-4 sm:grid-cols-2">
        {/* One number, formatted per locale on the public site (Western
            digits for en, Arabic-Indic for ku/ar) — so it's entered once,
            LTR, in plain digits. The label follows the active language tab. */}
        <Field label="ژمارە" name={`${nameBase}_value`} defaultValue={valueDefault} dir="ltr" />
        <LocalizedField name={`${nameBase}_label`} label="ناونیشان" defaults={labelDefaults} />
      </div>
    </div>
  );
}
