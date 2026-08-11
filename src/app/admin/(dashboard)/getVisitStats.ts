import { createAdminClient } from "@/lib/supabase/admin";

const WINDOW_DAYS = 14;

export type VisitStats = {
  windowDays: number;
  totalVisits: number;
  uniqueVisitors: number;
  topCountries: { label: string; count: number }[];
  topPaths: { label: string; count: number }[];
  dailyCounts: { date: string; count: number }[];
};

const EMPTY_STATS: VisitStats = {
  windowDays: WINDOW_DAYS,
  totalVisits: 0,
  uniqueVisitors: 0,
  topCountries: [],
  topPaths: [],
  dailyCounts: [],
};

function topEntries(counts: Map<string, number>, limit: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

/**
 * Gated by (dashboard)/layout.tsx's own requireAdminSession() check — see
 * the allowed-call-sites list on createAdminClient() — so this is safe to
 * read with the service-role client despite page_visits having no anon RLS
 * policies of its own.
 */
export async function getVisitStats(): Promise<VisitStats> {
  const since = new Date(Date.now() - WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const { data, error } = await createAdminClient()
    .from("page_visits")
    .select("path, country, ip_hash, created_at")
    .gte("created_at", since.toISOString())
    .limit(20000);

  if (error || !data) {
    return EMPTY_STATS;
  }

  const countryCounts = new Map<string, number>();
  const pathCounts = new Map<string, number>();
  const dayCounts = new Map<string, number>();
  const uniqueVisitors = new Set<string>();

  for (const visit of data) {
    countryCounts.set(visit.country ?? "نەزانراو", (countryCounts.get(visit.country ?? "نەزانراو") ?? 0) + 1);
    pathCounts.set(visit.path, (pathCounts.get(visit.path) ?? 0) + 1);

    const day = visit.created_at.slice(0, 10);
    dayCounts.set(day, (dayCounts.get(day) ?? 0) + 1);

    if (visit.ip_hash) uniqueVisitors.add(visit.ip_hash);
  }

  const dailyCounts: { date: string; count: number }[] = [];
  for (let i = WINDOW_DAYS - 1; i >= 0; i--) {
    const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
    dailyCounts.push({ date, count: dayCounts.get(date) ?? 0 });
  }

  return {
    windowDays: WINDOW_DAYS,
    totalVisits: data.length,
    uniqueVisitors: uniqueVisitors.size,
    topCountries: topEntries(countryCounts, 5),
    topPaths: topEntries(pathCounts, 5),
    dailyCounts,
  };
}
