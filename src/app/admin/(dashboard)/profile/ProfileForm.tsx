"use client";

import { useState } from "react";
import { LocalizedField } from "../../_components/LocalizedField";
import { SubmitButton } from "../../_components/SubmitButton";
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
  const [heroGallery, setHeroGallery] = useState<string[]>(initialGallery);
  const [newHeroFiles, setNewHeroFiles] = useState<{ url: string; file: File }[]>([]);
  const [contactCardPreview, setContactCardPreview] = useState<string | null>(
    profile?.contact_card_image_url ?? null
  );

  return (
    <form action={action} className="flex flex-col gap-8">
      <fieldset className="flex flex-col gap-3">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
          وێنەی پۆرترێتی پەڕەی سەرەکی
        </legend>

        {(heroGallery.length > 0 || newHeroFiles.length > 0) && (
          <div className="flex flex-wrap gap-3">
            {heroGallery.map((url, i) => (
              <div key={url} className="relative h-32 w-32">
                {/* eslint-disable-next-line @next/next/no-img-element -- external/blob previews aren't eligible for next/image optimization */}
                <img
                  src={url}
                  alt=""
                  className="h-full w-full rounded-xl border border-ink/10 bg-canvas-paper object-cover"
                />
                <input type="hidden" name="hero_image_urls_kept" value={url} />
                <button
                  type="button"
                  onClick={() => setHeroGallery((prev) => prev.filter((_, idx) => idx !== i))}
                  className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-ink text-fluid-xs text-canvas shadow-card"
                  aria-label="سڕینەوە"
                >
                  ×
                </button>
              </div>
            ))}
            {newHeroFiles.map(({ url }) => (
              // eslint-disable-next-line @next/next/no-img-element -- local blob previews aren't eligible for next/image optimization
              <img
                key={url}
                src={url}
                alt=""
                className="h-32 w-32 rounded-xl border border-dashed border-ink/20 bg-canvas-paper object-cover"
              />
            ))}
          </div>
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs text-ink-faint">
            زیادکردنی وێنە (دەتوانیت چەند وێنەیەک هەڵبژێریت — بە شێوەی خۆکار هەر ٦ چرکە دەگۆڕدرێن)
          </span>
          <input
            type="file"
            name="hero_image_gallery_files"
            accept="image/*"
            multiple
            onChange={(e) => {
              const files = Array.from(e.target.files ?? []);
              setNewHeroFiles(files.map((file) => ({ url: URL.createObjectURL(file), file })));
            }}
            className="rounded-xl border border-dashed border-ink/20 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-fluid-xs file:font-medium file:text-canvas"
          />
        </label>

        <p className="text-fluid-xs text-ink-faint">
          × لەسەر وێنەیەک لێی دەدەیت بۆ سڕینەوەی. وێنە نوێیەکان زیاد دەکرێن بۆ سەر ئەوانەی ماونەتەوە. هەر
          خانەیەکی دەقیش بەتاڵ بهێڵەرەوە بۆ گەڕانەوە بۆ دەقی بنەڕەتی ماڵپەڕ بۆ ئەو زمانە.
        </p>
      </fieldset>

      <fieldset className="flex flex-col gap-3">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
          وێنەی کارتی پەیوەندی (بەشی «پەیوەندی بکە»)
        </legend>

        {contactCardPreview && (
          // eslint-disable-next-line @next/next/no-img-element -- local blob: previews aren't eligible for next/image optimization
          <img
            src={contactCardPreview}
            alt=""
            className="h-48 w-48 rounded-xl border border-ink/10 bg-canvas-paper object-cover"
          />
        )}

        <label className="flex flex-col gap-1.5">
          <span className="text-fluid-xs text-ink-faint">بارکردنی فایلێک</span>
          <input
            type="file"
            name="contact_card_image_file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) setContactCardPreview(URL.createObjectURL(file));
            }}
            className="rounded-xl border border-dashed border-ink/20 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink-soft file:mr-3 file:rounded-full file:border-0 file:bg-ink file:px-3 file:py-1.5 file:text-fluid-xs file:font-medium file:text-canvas"
          />
        </label>

        <p className="text-fluid-xs text-ink-faint">
          کاتێک ئەم وێنەیە دابنرێت، لە جێی کارتی ستۆدیۆ و پەیوەندیی ڕەشی بەشی پەیوەندیدا بە هەمان قەبارە
          پیشان دەدرێت. بەتاڵی بهێڵەرەوە بۆ پیشاندانی کارتی ڕەشی بنەڕەتی.
        </p>
      </fieldset>

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

      <LocalizedField
        name="history"
        label="مێژووی مۆزەخانە"
        multiline
        resizable
        defaults={{
          ku: profile?.history_ku ?? "",
          en: profile?.history_en ?? "",
          ar: profile?.history_ar ?? "",
        }}
      />

      <fieldset className="flex flex-col gap-5">
        <legend className="text-fluid-xs font-medium uppercase tracking-[0.15em] text-ink-soft">
          ئامارەکانی لای لۆگۆ
        </legend>

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
      </fieldset>

      <div>
        <SubmitButton>پاشەکەوتکردنی گۆڕانکارییەکان</SubmitButton>
      </div>
    </form>
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
    <div className="grid gap-4 rounded-xl border border-ink/10 p-4 sm:grid-cols-2">
      <div className="sm:col-span-2 text-fluid-xs font-medium text-ink-soft">{title}</div>
      <label className="flex flex-col gap-1.5">
        <span className="text-fluid-xs text-ink-faint">ژمارە</span>
        <input
          type="text"
          name={`${nameBase}_value`}
          defaultValue={value}
          className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
        />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-fluid-xs text-ink-faint">ناونیشان</span>
        <input
          type="text"
          name={`${nameBase}_label`}
          defaultValue={label}
          className="rounded-xl border border-ink/15 bg-canvas px-3.5 py-2.5 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta focus:ring-2 focus:ring-pigment-terracotta/15"
        />
      </label>
    </div>
  );
}
