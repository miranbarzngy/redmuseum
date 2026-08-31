import { getLocale, getTranslations } from "next-intl/server";
import { getExhibitions } from "@/lib/data/exhibitions";
import { getSiteProfile } from "@/lib/data/profile";
import { statDefaults } from "@/lib/statDefaults";
import { Reveal } from "@/components/ui/Reveal";
import { ExhibitionsTimeline } from "./ExhibitionsTimeline";
import { MuseumStatsPanel } from "./MuseumStatsPanel";
import type { Locale } from "@/i18n/routing";
import type { SiteProfileRow } from "@/lib/supabase/database.types";

// Matches PaintCanvas/ScrollPigmentBar's accent red.
const ACCENT = "#850B10";

function pick(value: string | null | undefined, fallback: string) {
  return value?.trim() ? value : fallback;
}

/** Localized stat label: the admin's saved `stat_<key>_label_<locale>` value,
 * or the shipped default for that locale. */
function statLabel(
  profile: SiteProfileRow | null,
  key: keyof typeof statDefaults,
  locale: Locale
) {
  return pick(profile?.[`stat_${key}_label_${locale}`], statDefaults[key].label[locale]);
}

/**
 * Sits in the gap the shortened Hero (min-h-[70svh], was 100svh) opened up
 * before Biography. Composes the "History of the Museum" heading, the
 * scroll-driven exhibitions timeline, and the animated stats + logo panel —
 * the actual interactive behavior for the latter two lives in their own
 * client components (ExhibitionsTimeline, MuseumStatsPanel) since this stays
 * a server component for the data fetching.
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
          <span
            className="font-body text-fluid-xs font-semibold uppercase tracking-[0.3em]"
            style={{ color: ACCENT }}
          >
            {t("historyEyebrow")}
          </span>
          <h2 className="font-display text-fluid-xl font-semibold text-ink">{t("historyHeading")}</h2>
          <span className="h-[3px] w-14 rounded-full" style={{ backgroundColor: ACCENT }} />
        </div>
      </Reveal>

      <ExhibitionsTimeline exhibitions={exhibitions} locale={loc} emptyText={t("timelineEmpty")} />

      <MuseumStatsPanel
        locale={loc}
        stats={{
          museums: {
            value: pick(profile?.stat_museums_value, statDefaults.museums.value),
            label: statLabel(profile, "museums", loc),
          },
          archive: {
            value: pick(profile?.stat_archive_value, statDefaults.archive.value),
            label: statLabel(profile, "archive", loc),
          },
          activities: {
            value: pick(profile?.stat_activities_value, statDefaults.activities.value),
            label: statLabel(profile, "activities", loc),
          },
          visitors: {
            value: pick(profile?.stat_visitors_value, statDefaults.visitors.value),
            label: statLabel(profile, "visitors", loc),
          },
        }}
      />
    </div>
  );
}
