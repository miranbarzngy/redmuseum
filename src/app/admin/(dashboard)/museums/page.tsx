import Link from "next/link";
import { CheckCircle2, Plus, Pencil } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { DeleteButton } from "../../_components/DeleteButton";
import { IntroForm } from "./IntroForm";
import { deleteBiographyBlock, updateBiographyIntro } from "./actions";

export default async function AdminBiographyPage(
  props: {
    searchParams: Promise<{ saved?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const supabase = createClient();
  const [{ data: intro }, { data: blocks, error: blocksError }] = await Promise.all([
    supabase.from("biography_intro").select("*").eq("id", 1).maybeSingle(),
    supabase.from("biography_blocks").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">بەشەکانی مۆزەخانە</h1>
        <p className="mt-1 text-fluid-sm text-ink-soft">
          دەربڕین، ناونیشان، سەرەتا و پەراگرافە بچووکەکانی بەشەکانی مۆزەخانە.
        </p>
      </div>
      {searchParams.saved === "1" && (
        <p className="flex items-center gap-2 rounded-xl bg-pigment-teal/10 px-4 py-3 text-fluid-sm text-pigment-teal">
          <CheckCircle2 size={16} /> پاشەکەوت کرا.
        </p>
      )}
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <IntroForm action={updateBiographyIntro} intro={intro} />
      </div>
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="font-kurdish text-fluid-lg font-semibold text-ink">بەشە پەراگرافەکان</h2>
            <p className="mt-1 text-fluid-sm text-ink-soft">
              هەر بەشێک پەراگرافێک لەگەڵ وێنەیەکی پۆرترێت جووت دەکات، بەپێی ڕیزبەندی پیشان دەدرێت.
            </p>
          </div>
          <Link
            href="/admin/museums/blocks/new"
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-4 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
          >
            <Plus size={16} /> زیادکردنی بەش
          </Link>
        </div>

        {blocksError && (
          <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
            سەرکەوتوو نەبوو لە بارکردنی بەشەکان: {blocksError.message}
          </p>
        )}

        {!blocksError && (blocks?.length ?? 0) === 0 && (
          <p className="text-fluid-sm text-ink-faint">
            هێشتا هیچ بەشێک نییە — ماڵپەڕ دەگەڕێتەوە بۆ پەراگرافە بنەڕەتییەکانی خۆی تا ئێرە بەشیان زیاد بکەیت.
          </p>
        )}

        <div className="flex flex-col gap-3">
          {blocks?.map((block) => (
            <div
              key={block.id}
              className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card"
            >
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-canvas-paper">
                {block.image_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  (<img src={block.image_url} alt="" className="h-full w-full object-cover" />)
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-fluid-sm font-medium text-ink">
                  {block.body_ku || <span className="text-ink-faint">(هێشتا دەقی کوردی نییە)</span>}
                </div>
                <div className="text-fluid-xs text-ink-faint">ڕیزبەندی {block.sort_order}</div>
              </div>
              <Link
                href={`/admin/museums/blocks/${block.id}`}
                aria-label="دەستکاریکردن"
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
              >
                <Pencil size={15} />
              </Link>
              <DeleteButton
                action={deleteBiographyBlock.bind(null, block.id)}
                confirmMessage="ئەم بەشە پەراگرافە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
