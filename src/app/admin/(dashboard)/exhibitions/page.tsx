import { Plus, CalendarClock } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { LinkButton } from "../../_components/Button";
import { ExhibitionList } from "./ExhibitionList";

export default async function AdminExhibitionsPage() {
  const supabase = createClient();
  const { data: exhibitions, error } = await supabase
    .from("exhibitions")
    .select("*")
    .order("sort_order", { ascending: true });

  const hasRows = (exhibitions?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="پێشانگاکان"
        description="هێڵی کاتی پێشانگاکان لە بەشەکانی مۆزەخانەدا. بە ڕاکێشان ڕیزبەندی بگۆڕە."
      >
        <LinkButton href="/admin/exhibitions/new">
          <Plus size={16} /> زیادکردنی پێشانگا
        </LinkButton>
      </PageHeader>

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی پێشانگاکان: {error.message}
        </p>
      )}

      {!error && !hasRows && (
        <EmptyState icon={CalendarClock} title="هێشتا هیچ پێشانگایەک نییە">
          <LinkButton href="/admin/exhibitions/new">
            <Plus size={16} /> زیادکردنی یەکەم پێشانگا
          </LinkButton>
        </EmptyState>
      )}

      {!error && hasRows && <ExhibitionList exhibitions={exhibitions ?? []} />}
    </div>
  );
}
