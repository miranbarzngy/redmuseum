import { Plus, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { LinkButton } from "../../_components/Button";
import { ExhibitionList } from "./ExhibitionList";

export default async function AdminMuseumHistoryPage() {
  const supabase = createClient();
  const { data: exhibitions, error } = await supabase
    .from("exhibitions")
    .select("*")
    .order("sort_order", { ascending: true });

  const hasRows = (exhibitions?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="مێژووی مۆزەخانە"
        description="هێڵی کاتی ڕووداوەکانی مۆزەخانە. بە ڕاکێشان ڕیزبەندی بگۆڕە."
      >
        <LinkButton href="/admin/museumhistory/new">
          <Plus size={16} /> زیادکردنی ڕووداو
        </LinkButton>
      </PageHeader>

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی مێژووی مۆزەخانە: {error.message}
        </p>
      )}

      {!error && !hasRows && (
        <EmptyState icon={CalendarClock} title="هێشتا هیچ ڕووداوێک نییە">
          <LinkButton href="/admin/museumhistory/new">
            <Plus size={16} /> زیادکردنی یەکەمین ڕووداو
          </LinkButton>
        </EmptyState>
      )}

      {!error && hasRows && <ExhibitionList exhibitions={exhibitions ?? []} />}
    </div>
  );
}
