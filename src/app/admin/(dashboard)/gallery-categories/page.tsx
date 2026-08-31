import { Plus, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { LinkButton } from "../../_components/Button";
import { CategoryList } from "./CategoryList";

export default async function AdminGalleryCategoriesPage() {
  const supabase = createClient();
  const { data: categories, error } = await supabase
    .from("gallery_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  const hasRows = (categories?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="پۆلەکانی گەلەری"
        description="پۆلەکانی وێنە کە لە گەلەریدا وەک ستریپی جیاواز پیشان دەدرێن. بە ڕاکێشان ڕیزبەندی بگۆڕە."
        backHref="/admin/gallery"
        backLabel="گەڕانەوە بۆ گەلەری"
      >
        <LinkButton href="/admin/gallery-categories/new">
          <Plus size={16} /> زیادکردنی پۆل
        </LinkButton>
      </PageHeader>

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی پۆلەکان: {error.message}
        </p>
      )}

      {!error && !hasRows && (
        <EmptyState icon={Tags} title="هێشتا هیچ پۆلێک نییە">
          <LinkButton href="/admin/gallery-categories/new">
            <Plus size={16} /> زیادکردنی یەکەم پۆل
          </LinkButton>
        </EmptyState>
      )}

      {!error && hasRows && <CategoryList categories={categories!} />}
    </div>
  );
}
