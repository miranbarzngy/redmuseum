import Link from "next/link";
import { Plus, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { GalleryImageList } from "./GalleryImageList";
import type { GalleryRow, GalleryCategoryRow } from "@/lib/supabase/database.types";

// database.types.ts is hand-written and has no Relationships metadata, so
// the joined select's shape below must be described locally (see the same
// pattern in src/lib/data/gallery.ts).
type GalleryRowWithCategory = GalleryRow & { category: GalleryCategoryRow | null };

const ALL = "all";

export default async function AdminGalleryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category: activeSlug = ALL } = await searchParams;
  const supabase = createClient();
  const [{ data, error }, { data: categories }] = await Promise.all([
    supabase.from("gallery").select("*, category:gallery_categories(*)"),
    supabase.from("gallery_categories").select("*").order("sort_order", { ascending: true }),
  ]);

  const items = (data as GalleryRowWithCategory[] | null)
    ?.slice()
    .sort(
      (a, b) =>
        (a.category?.sort_order ?? 0) - (b.category?.sort_order ?? 0) ||
        a.display_order - b.display_order
    );

  const visible = items?.filter((g) => activeSlug === ALL || g.category?.slug === activeSlug);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">گەلەری</h1>
          <p className="mt-1 text-fluid-sm text-ink-soft">وێنەکانی چالاکی، بەخشین، سەردان و شاندەکان.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/gallery-categories"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
          >
            <Tags size={16} /> بەڕێوەبردنی پۆلەکان
          </Link>
          <Link
            href="/admin/gallery/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
          >
            <Plus size={16} /> زیادکردنی وێنە
          </Link>
        </div>
      </div>

      {categories && categories.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/admin/gallery"
            className={`inline-flex items-center rounded-full px-4 py-2 text-fluid-xs font-medium transition-colors ${
              activeSlug === ALL
                ? "bg-ink text-canvas"
                : "border border-ink/15 text-ink-soft hover:border-pigment-terracotta hover:text-pigment-terracotta"
            }`}
          >
            هەموو
          </Link>
          {categories.map((c) => (
            <Link
              key={c.id}
              href={`/admin/gallery?category=${c.slug}`}
              className={`inline-flex items-center rounded-full px-4 py-2 text-fluid-xs font-medium transition-colors ${
                activeSlug === c.slug
                  ? "bg-ink text-canvas"
                  : "border border-ink/15 text-ink-soft hover:border-pigment-terracotta hover:text-pigment-terracotta"
              }`}
            >
              {c.label_ku}
            </Link>
          ))}
        </div>
      )}

      {activeSlug === ALL && (visible?.length ?? 0) > 0 && (
        <p className="text-fluid-xs text-ink-faint">
          بۆ گۆڕینی ڕیزبەندی بە ڕاکێشان، تکایە پۆلێک هەڵبژێرە — ڕیزبەندی بۆ هەر پۆلێک جیایە.
        </p>
      )}

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی گەلەری: {error.message}
        </p>
      )}

      {!error && (visible?.length ?? 0) === 0 && (
        <p className="text-fluid-sm text-ink-faint">هێشتا هیچ وێنەیەک نییە — یەکەمیان زیاد بکە.</p>
      )}

      {visible && visible.length > 0 && (
        <GalleryImageList key={activeSlug} items={visible} draggable={activeSlug !== ALL} />
      )}
    </div>
  );
}
