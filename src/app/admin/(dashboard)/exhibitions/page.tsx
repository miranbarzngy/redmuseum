import Link from "next/link";
import { Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "../../_components/DeleteButton";
import { deleteExhibition } from "./actions";

export default async function AdminExhibitionsPage() {
  const supabase = createClient();
  const { data: exhibitions, error } = await supabase
    .from("exhibitions")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">پێشانگاکان</h1>
          <p className="mt-1 text-fluid-sm text-ink-soft">هێڵی کاتی پیشاندراو لە بەشەکانی مۆزەخانەدا.</p>
        </div>
        <Link
          href="/admin/exhibitions/new"
          className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
        >
          <Plus size={16} /> زیادکردنی پێشانگا
        </Link>
      </div>

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی پێشانگاکان: {error.message}
        </p>
      )}

      {!error && (exhibitions?.length ?? 0) === 0 && (
        <p className="text-fluid-sm text-ink-faint">هێشتا هیچ پێشانگایەک نییە — یەکەمیان زیاد بکە.</p>
      )}

      <div className="flex flex-col gap-3">
        {exhibitions?.map((ex) => (
          <div
            key={ex.id}
            className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-fluid-sm font-medium text-ink">{ex.title_ku}</div>
              <div className="text-fluid-xs text-ink-faint">
                {ex.year} · ڕیزبەندی {ex.sort_order}
              </div>
            </div>
            <Link
              href={`/admin/exhibitions/${ex.id}`}
              aria-label="دەستکاریکردن"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
            >
              <Pencil size={15} />
            </Link>
            <DeleteButton
              action={deleteExhibition.bind(null, ex.id)}
              confirmMessage={`سڕینەوەی پێشانگای "${ex.title_ku}"؟`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
