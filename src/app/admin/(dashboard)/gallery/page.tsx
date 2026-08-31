import { Plus, Tags, Images } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { LinkButton } from "../../_components/Button";
import { FilterTabs, type FilterOption } from "../../_components/FilterTabs";
import { GalleryImageList } from "./GalleryImageList";
import type { GalleryRow, GalleryCategoryRow } from "@/lib/supabase/database.types";

// database.types.ts is hand-written with no Relationships metadata, so the
// joined select's shape is described locally (same pattern as data/gallery.ts).
type GalleryRowWithCategory = GalleryRow & { category: GalleryCategoryRow | null };

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: rawCategory } = await searchParams;
  const supabase = createClient();
  const [{ data, error }, { data: categories }] = await Promise.all([
    supabase.from("gallery").select("*, category:gallery_categories(*)"),
    supabase.from("gallery_categories").select("*").order("sort_order", { ascending: true }),
  ]);

  const cats = categories ?? [];
  const defaultSlug = cats[0]?.slug;
  const activeSlug = rawCategory ?? defaultSlug;

  const items = ((data as GalleryRowWithCategory[] | null) ?? [])
    .slice()
    .sort(
      (a, b) =>
        (a.category?.sort_order ?? 0) - (b.category?.sort_order ?? 0) ||
        a.display_order - b.display_order
    );

  const visible = items.filter((g) => g.category?.slug === activeSlug);

  const filterOptions: FilterOption[] = cats.map((c) => ({
    value: c.slug,
    label: c.label_ku,
    count: items.filter((g) => g.category?.slug === c.slug).length,
  }));

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="گەلەری"
        description="وێنەکانی چالاکی، بەخشین، سەردان و شاندەکان."
      >
        <LinkButton href="/admin/gallery-categories" variant="secondary">
          <Tags size={16} /> بەڕێوەبردنی پۆلەکان
        </LinkButton>
        <LinkButton href="/admin/gallery/new">
          <Plus size={16} /> زیادکردنی وێنە
        </LinkButton>
      </PageHeader>

      {cats.length > 0 && (
        <FilterTabs param="category" options={filterOptions} defaultValue={defaultSlug} />
      )}

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی گەلەری: {error.message}
        </p>
      )}

      {!error && (visible?.length ?? 0) === 0 && (
        <EmptyState icon={Images} title="هێشتا هیچ وێنەیەک نییە">
          <LinkButton href="/admin/gallery/new">
            <Plus size={16} /> زیادکردنی یەکەم وێنە
          </LinkButton>
        </EmptyState>
      )}

      {visible && visible.length > 0 && (
        <GalleryImageList key={activeSlug} items={visible} draggable />
      )}
    </div>
  );
}
