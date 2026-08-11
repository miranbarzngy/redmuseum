import { Eye, Users, Globe } from "lucide-react";
import type { VisitStats } from "./getVisitStats";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Eye;
  label: string;
  value: number;
}) {
  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-card backdrop-blur-md">
      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-paper text-pigment-terracotta">
        <Icon size={18} />
      </span>
      <div>
        <div className="font-kurdish text-fluid-2xl font-semibold text-ink">{value}</div>
        <div className="font-kurdish text-fluid-sm text-ink-soft">{label}</div>
      </div>
    </div>
  );
}

function RankedList({ title, entries }: { title: string; entries: { label: string; count: number }[] }) {
  const max = Math.max(1, ...entries.map((e) => e.count));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-card backdrop-blur-md">
      <h3 className="font-kurdish text-fluid-sm font-semibold text-ink">{title}</h3>
      {entries.length === 0 ? (
        <p className="font-kurdish text-fluid-xs text-ink-faint">هێشتا هیچ سەردانێک تۆمار نەکراوە.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {entries.map(({ label, count }) => (
            <div key={label} className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between gap-2">
                <span className="truncate text-fluid-xs text-ink" dir="ltr">
                  {label}
                </span>
                <span className="font-kurdish shrink-0 text-fluid-xs text-ink-soft">{count}</span>
              </div>
              <div className="h-1.5 rounded-full bg-canvas-paper">
                <div
                  className="h-full rounded-full bg-pigment-terracotta/70"
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function DailyTrendChart({ dailyCounts }: { dailyCounts: { date: string; count: number }[] }) {
  const max = Math.max(1, ...dailyCounts.map((d) => d.count));

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-card backdrop-blur-md">
      <h3 className="font-kurdish text-fluid-sm font-semibold text-ink">ڕەوتی ڕۆژانە</h3>
      <div className="flex h-32 items-end gap-1.5">
        {dailyCounts.map(({ date, count }) => (
          <div key={date} className="flex flex-1 flex-col items-center gap-1.5" title={`${date}: ${count}`}>
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full rounded-t-sm bg-pigment-terracotta/70"
                style={{ height: `${Math.max(4, (count / max) * 100)}%` }}
              />
            </div>
            <span className="text-[10px] text-ink-faint" dir="ltr">
              {date.slice(5)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AnalyticsSection({ stats }: { stats: VisitStats }) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-kurdish text-fluid-lg font-semibold text-ink">ئامارەکانی سەردانکەران</h2>
        <p className="font-kurdish mt-1 text-fluid-sm text-ink-soft">
          سەردانەکانی ماڵپەڕی گشتی لە دوایین {stats.windowDays} ڕۆژدا.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        <StatCard icon={Eye} label="کۆی سەردانەکان" value={stats.totalVisits} />
        <StatCard icon={Users} label="سەردانکەرە جیاوازەکان" value={stats.uniqueVisitors} />
        <StatCard icon={Globe} label="وڵاتەکان" value={stats.topCountries.length} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <DailyTrendChart dailyCounts={stats.dailyCounts} />
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-1">
          <RankedList title="زۆرترین وڵات" entries={stats.topCountries} />
          <RankedList title="زۆرترین پەڕە" entries={stats.topPaths} />
        </div>
      </div>
    </div>
  );
}
