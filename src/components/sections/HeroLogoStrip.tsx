import { getLocale, getTranslations } from "next-intl/server";
import { getExhibitions } from "@/lib/data/exhibitions";
import { getSiteProfile } from "@/lib/data/profile";
import { Reveal } from "@/components/ui/Reveal";
import { ExhibitionsTimeline } from "./ExhibitionsTimeline";
import { MuseumStatsPanel } from "./MuseumStatsPanel";
import type { Locale } from "@/i18n/routing";

// Matches PaintCanvas/ScrollPigmentBar's accent red.
const ACCENT = "#850B10";

function pick(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

/**
 * Sits in the gap the shortened Hero (min-h-[70svh], was 100svh) opened up
 * before Biography. Composes the "مێژووی مۆزەخانە" heading, the scroll-driven
 * exhibitions timeline, and the animated stats + logo panel — the actual
 * interactive behavior for the latter two lives in their own client
 * components (ExhibitionsTimeline, MuseumStatsPanel) since this stays a
 * server component for the data fetching.
 */
export async function HeroLogoStrip() {
  const [exhibitions, profile, locale, t] = await Promise.all([
    getExhibitions(),
    getSiteProfile(),
    getLocale(),
    getTranslations("biography"),
  ]);
  const loc = locale as Locale;

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-10 px-4 py-14 sm:px-8 sm:py-20">
      <Reveal from="fade">
        <div className="flex flex-col items-center gap-3 text-center">
          <span className="text-fluid-xs font-semibold uppercase tracking-[0.3em]" style={{ color: ACCENT }}>
            هێڵی کات
          </span>
          <h2 className="font-display text-fluid-xl font-semibold text-ink">مێژووی مۆزەخانە</h2>
          <span className="h-[3px] w-14 rounded-full" style={{ backgroundColor: ACCENT }} />
        </div>
      </Reveal>

      <ExhibitionsTimeline exhibitions={exhibitions} locale={loc} emptyText={t("timelineEmpty")} />

      <MuseumStatsPanel
        stats={{
          museums: {
            value: pick(profile?.stat_museums_value, "١١"),
            label: pick(profile?.stat_museums_label, "مۆزە"),
          },
          archive: {
            value: pick(profile?.stat_archive_value, "١,٨٩٨"),
            label: pick(profile?.stat_archive_label, "پارچە ئەرشیف"),
          },
          activities: {
            value: pick(profile?.stat_activities_value, "+٥٠"),
            label: pick(profile?.stat_activities_label, "چالاکی ساڵانە"),
          },
          visitors: {
            value: pick(profile?.stat_visitors_value, "٢٠,٠٠٠"),
            label: pick(profile?.stat_visitors_label, "سەردانیکەر ساڵانە"),
          },
        }}
      />
    </div>
  );
}
