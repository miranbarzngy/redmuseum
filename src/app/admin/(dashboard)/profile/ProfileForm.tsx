"use client";

import { useState } from "react";
import clsx from "clsx";
import { Upload, FileText } from "lucide-react";
import { ADMIN_LANGS, LanguageProvider, LanguageTabs, useLanguage } from "../../_components/LanguageTabs";
import { LocalizedField } from "../../_components/LocalizedField";
import { Field, fieldControlClass } from "../../_components/Field";
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

// Unlike withFallback, this keeps an explicitly-cleared value ("") empty
// instead of re-showing the shipped default — otherwise saving the form
// again after clearing a social link would silently restore it.
function savedOrFallback(value: string | null | undefined, fallback: string) {
  return value == null ? fallback : value;
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
            label="وێنەی پۆرترێتی پەڕەی سەرەکی (16:9)"
            name="hero_image_gallery_files"
            keptName="hero_image_urls_kept"
            currentUrls={initialGallery}
            fileLabel="زیادکردنی وێنە"
            hint="چەند وێنە زیاد بکە بۆ گۆڕانی خۆکار هەر ٦ چرکە."
            previewClassName="aspect-video h-28 object-cover"
          />
        </Panel>

        <Panel
          title="دەقەکان"
          action={<LanguageTabs />}
          collapsible
          defaultOpen={false}
          bodyClassName="flex flex-col gap-8"
        >
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
          <NumberedField number={1}>
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
          </NumberedField>
          <NumberedField number={2}>
            <LocalizedWordsGridField
              name="statement_words"
              label="وشە جێگۆڕەکان"
              defaultWords={{
                ku:
                  profile?.statement_words_ku && profile.statement_words_ku.length > 0
                    ? profile.statement_words_ku
                    : homepageDefaults.statementWords.ku,
                en:
                  profile?.statement_words_en && profile.statement_words_en.length > 0
                    ? profile.statement_words_en
                    : homepageDefaults.statementWords.en,
                ar:
                  profile?.statement_words_ar && profile.statement_words_ar.length > 0
                    ? profile.statement_words_ar
                    : homepageDefaults.statementWords.ar,
              }}
              hint="لە دوای 'دەربارە / دەربڕین' پیشان دەدرێت. بەتاڵی بهێڵەرەوە ئەگەر ناتەوێت وشەی گۆڕاو بۆ ئەم زمانە پیشان بدرێت."
            />
          </NumberedField>
          <NumberedField number={3}>
            <LocalizedField
              name="statement_suffix"
              label="تەواوکەری ڕستە"
              defaults={{
                ku: savedOrFallback(profile?.statement_suffix_ku, homepageDefaults.statementSuffix.ku),
                en: savedOrFallback(profile?.statement_suffix_en, homepageDefaults.statementSuffix.en),
                ar: savedOrFallback(profile?.statement_suffix_ar, homepageDefaults.statementSuffix.ar),
              }}
              hint="دەقی کۆتای"
            />
          </NumberedField>
        </Panel>

        <Panel
          title="ئامارەکانی لای لۆگۆ"
          action={<LanguageTabs />}
          collapsible
          defaultOpen={false}
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
          collapsible
          defaultOpen={false}
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
          <Field
            label="ژمارەی پەیوەندی"
            name="contact_phone"
            type="text"
            dir="ltr"
            defaultValue={savedOrFallback(profile?.contact_phone, contactDefaults.phone)}
            hint="بەتاڵی بهێڵەرەوە ئەگەر ناتەوێت ژمارەیەک لە پێڕستەکەدا دەربکەوێت."
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
              defaultValue={savedOrFallback(
                profile?.social_instagram_url,
                contactDefaults.socials.instagram
              )}
            />
            <Field
              label="فەیسبووک"
              name="social_facebook_url"
              type="text"
              dir="ltr"
              defaultValue={savedOrFallback(
                profile?.social_facebook_url,
                contactDefaults.socials.facebook
              )}
            />
            <Field
              label="ئێکس (تویتەر)"
              name="social_x_url"
              type="text"
              dir="ltr"
              defaultValue={savedOrFallback(profile?.social_x_url, contactDefaults.socials.x)}
            />
            <Field
              label="یوتیوب"
              name="social_youtube_url"
              type="text"
              dir="ltr"
              defaultValue={savedOrFallback(
                profile?.social_youtube_url,
                contactDefaults.socials.youtube
              )}
            />
          </div>
          <span className="font-kurdish text-fluid-xs text-ink-faint">
            هەر خانەیەک بەتاڵ بکەیتەوە، ئەو دوگمەیە لە ماڵپەڕەکە لادەبرێت.
          </span>

          <PdfField
            label="فۆڵدەری ڕێنیشاندەر (PDF)"
            name="guide_flyer_file"
            urlName="guide_flyer_url"
            currentUrl={profile?.guide_flyer_url ?? null}
            hint="ئەو فایلەی کە بە دوگمەی داگرتن لە بەشی پەیوەندیدا پیشان دەدرێت."
          />
        </Panel>

        <SaveBar />
      </form>
    </LanguageProvider>
  );
}

/** Single PDF field with two ways in: upload a file, or paste a direct link.
 * `urlName` is a plain always-rendered text input (like contact_map_url) —
 * editing or clearing it directly changes the saved value; picking a file
 * takes priority over it server-side regardless of what's typed there. */
function PdfField({
  label,
  name,
  urlName,
  currentUrl,
  hint,
}: {
  label: string;
  name: string;
  urlName: string;
  currentUrl: string | null;
  hint?: string;
}) {
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-kurdish text-fluid-xs font-medium text-ink-soft">{label}</legend>
      <div className="flex flex-wrap items-center gap-3">
        <label className="group flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-ink/25 bg-canvas-paper/60 px-4 py-2.5 text-fluid-xs text-ink-soft transition hover:border-ink/45 hover:bg-canvas-paper">
          <Upload size={14} />
          {fileName ? "گۆڕینی فایل" : "هەڵبژاردنی فایلی PDF"}
          <input
            type="file"
            name={name}
            accept="application/pdf"
            className="sr-only"
            onChange={(e) => setFileName(e.target.files?.[0]?.name ?? null)}
          />
        </label>

        {fileName && (
          <span className="flex items-center gap-2 rounded-full border border-ink/10 bg-canvas px-3 py-1.5 text-fluid-xs text-ink-soft">
            <FileText size={14} className="text-[#850B10]" />
            <span className="max-w-[220px] truncate">{fileName}</span>
            <button
              type="button"
              onClick={() => setFileName(null)}
              aria-label="سڕینەوە"
              className="text-ink-faint transition-colors hover:text-pigment-crimson"
            >
              ×
            </button>
          </span>
        )}
      </div>

      <div className="flex items-center gap-2">
        <span className="font-kurdish text-fluid-xs text-ink-faint">یان</span>
        <input
          type="text"
          name={urlName}
          dir="ltr"
          defaultValue={currentUrl ?? ""}
          placeholder="https://example.com/guide.pdf"
          className={fieldControlClass}
        />
      </div>
      {fileName && (
        <span className="font-kurdish text-fluid-xs text-ink-faint">
          فایلی هەڵبژێردراو پێشتری وەردەگیرێت — لینکەکەی سەرەوە پشتگوێ دەخرێت.
        </span>
      )}
      {hint && <span className="font-kurdish text-fluid-xs text-ink-faint">{hint}</span>}
    </fieldset>
  );
}

/** Marks a field as step N of the sentence the hero rotator assembles
 * (statement prefix → rotating word → suffix), so the order reads clearly
 * even though the three fields sit in separate blocks. */
function NumberedField({ number, children }: { number: number; children: React.ReactNode }) {
  return (
    <div className="relative ps-8">
      <span className="absolute start-0 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-ink/5 text-fluid-xs font-medium text-ink-faint">
        {number}
      </span>
      {children}
    </div>
  );
}

/** Grid of individually-editable words sharing one `name` — submitted as
 * repeated FormData entries and collected server-side with `getAll()`.
 * Used for the hero rotator's word list, where a stacked textarea made each
 * word harder to scan than a short grid. */
function WordsGrid({
  name,
  dir,
  defaultWords,
}: {
  name: string;
  dir: "rtl" | "ltr";
  defaultWords: string[];
}) {
  const [words, setWords] = useState<string[]>(defaultWords.length > 0 ? defaultWords : [""]);

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {words.map((word, i) => (
        <div key={i} className="relative">
          <span className="pointer-events-none absolute start-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full bg-ink/5 text-fluid-xs font-medium text-ink-faint">
            {i + 1}
          </span>
          <input
            name={name}
            dir={dir}
            value={word}
            onChange={(e) =>
              setWords((prev) => prev.map((w, idx) => (idx === i ? e.target.value : w)))
            }
            className={clsx(fieldControlClass, "pe-8 ps-8")}
          />
          <button
            type="button"
            onClick={() => setWords((prev) => prev.filter((_, idx) => idx !== i))}
            disabled={words.length <= 1}
            aria-label="سڕینەوە"
            className="absolute end-1.5 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-ink-faint transition-colors hover:bg-pigment-crimson/10 hover:text-pigment-crimson disabled:pointer-events-none disabled:opacity-30"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setWords((prev) => [...prev, ""])}
        className={clsx(
          fieldControlClass,
          "flex items-center justify-center border-dashed text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
        )}
      >
        + وشە
      </button>
    </div>
  );
}

/** Three <WordsGrid>s (ku/en/ar) sharing one `name` prefix — submitted as
 * `${name}_ku`/`${name}_en`/`${name}_ar`, same convention as
 * <LocalizedField>. Mirrors its hidden-not-unmounted tab switching so all
 * three languages' word lists submit together regardless of which tab is
 * active when the form is saved. */
function LocalizedWordsGridField({
  name,
  label,
  hint,
  defaultWords,
}: {
  name: string;
  label: string;
  hint?: string;
  defaultWords: { ku: string[]; en: string[]; ar: string[] };
}) {
  const ctx = useLanguage();

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="font-kurdish text-fluid-sm font-medium text-ink-soft">{label}</legend>
      {ADMIN_LANGS.map((lang) => {
        const hidden = ctx ? ctx.active !== lang.code : false;
        return (
          <div key={lang.code} className={hidden ? "hidden" : undefined}>
            <WordsGrid
              name={`${name}_${lang.code}`}
              dir={lang.dir}
              defaultWords={defaultWords[lang.code]}
            />
          </div>
        );
      })}
      {hint && <span className="font-kurdish text-fluid-xs text-ink-faint">{hint}</span>}
    </fieldset>
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
