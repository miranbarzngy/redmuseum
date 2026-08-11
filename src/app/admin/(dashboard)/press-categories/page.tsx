import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteCategory } from "./actions";

export default async function AdminPressCategoriesPage() {
  const supabase = createClient();
  const { data: categories, error } = await supabase
    .from("press_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">پۆلەکانی میدیا</h1>
          <p className="mt-1 text-fluid-sm text-ink-soft">
            پۆلەکانی بابەتی میدیا کە لە بەشی میدیا و چاپەمەنیدا وەک فلتەر پیشان دەدرێن.
          </p>
        </div>
        <Link
          href="/admin/press-categories/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
        >
          <Plus size={16} /> زیادکردنی پۆل
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی پۆلەکان: {error.message}
        </p>
      )}

      {!error && (categories?.length ?? 0) === 0 && (
        <p className="text-fluid-sm text-ink-faint">هێشتا هیچ پۆلێک نییە — یەکەمیان زیاد بکە.</p>
      )}

      <div className="flex flex-col gap-3">
        {categories?.map((c) => (
          <div
            key={c.id}
            className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-fluid-sm font-medium text-ink">{c.label_ku}</div>
              <div className="text-fluid-xs text-ink-faint">{c.slug} · ڕیزبەندی {c.sort_order}</div>
            </div>
            <Link
              href={`/admin/press-categories/${c.id}`}
              aria-label="دەستکاریکردن"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
            >
              <Pencil size={15} />
            </Link>
            <DeleteButton
              action={deleteCategory.bind(null, c.id)}
              confirmMessage={`سڕینەوەی پۆلی "${c.label_ku}"؟ ئەگەر بابەتی میدیای پەیوەستی هەبێت ناتوانرێت بسڕدرێتەوە.`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
