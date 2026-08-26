import Link from "next/link";
import { Plus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CategoryList } from "./CategoryList";

export default async function AdminGalleryCategoriesPage() {
  const supabase = createClient();
  const { data: categories, error } = await supabase
    .from("gallery_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">پۆلەکانی گەلەری</h1>
          <p className="mt-1 text-fluid-sm text-ink-soft">
            پۆلەکانی وێنە کە لە بەشی گەلەریدا وەک ستریپی جیاواز پیشان دەدرێن. بۆ گۆڕینی ڕیزبەندی، دەستەی{" "}
            <span aria-hidden>⠿</span> ڕابکێشە.
          </p>
        </div>
        <Link
          href="/admin/gallery-categories/new"
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

      {!error && (categories?.length ?? 0) > 0 && <CategoryList categories={categories!} />}
    </div>
  );
}
