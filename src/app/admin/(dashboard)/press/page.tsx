import Link from "next/link";
import { Plus, Pencil, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "../../_components/DeleteButton";
import { deletePressItem } from "./actions";
import type { PressMediaRow, PressCategoryRow } from "@/lib/supabase/database.types";

// database.types.ts is hand-written and has no Relationships metadata, so
// the joined select's shape below must be described locally (see the same
// pattern in src/lib/data/press.ts).
type PressMediaWithCategory = PressMediaRow & { category: PressCategoryRow | null };

export default async function AdminPressPage() {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("press_media")
    .select("*, category:press_categories(*)")
    .order("date", { ascending: false });
  const items = data as PressMediaWithCategory[] | null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">میدیا و چاپەمەنی</h1>
          <p className="mt-1 text-fluid-sm text-ink-soft">چاوپێکەوتن، وتار و بڵاوکراوەکان.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/press-categories"
            className="inline-flex items-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
          >
            <Tags size={16} /> بەڕێوەبردنی پۆلەکان
          </Link>
          <Link
            href="/admin/press/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
          >
            <Plus size={16} /> زیادکردنی بابەتی میدیا
          </Link>
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی بابەتەکانی میدیا: {error.message}
        </p>
      )}

      {!error && (items?.length ?? 0) === 0 && (
        <p className="text-fluid-sm text-ink-faint">هێشتا هیچ بابەتێکی میدیا نییە — یەکەمیان زیاد بکە.</p>
      )}

      <div className="flex flex-col gap-3">
        {items?.map((p) => (
          <div
            key={p.id}
            className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card"
          >
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-canvas-paper">
              {p.image_url && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={p.image_url} alt="" className="h-full w-full object-cover" />
              )}
            </div>
            <div className="w-28 shrink-0 text-fluid-xs text-ink-faint">{p.date}</div>
            <div className="min-w-0 flex-1">
              <div className="truncate text-fluid-sm font-medium text-ink">{p.title_ku}</div>
              <div className="text-fluid-xs text-ink-faint">
                {p.source} · {p.category?.label_ku ?? "—"}
              </div>
            </div>
            <Link
              href={`/admin/press/${p.id}`}
              aria-label="دەستکاریکردن"
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
            >
              <Pencil size={15} />
            </Link>
            <DeleteButton
              action={deletePressItem.bind(null, p.id)}
              confirmMessage={`سڕینەوەی "${p.title_ku}"؟ ناتوانرێت هەڵبوەشێندرێتەوە.`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
