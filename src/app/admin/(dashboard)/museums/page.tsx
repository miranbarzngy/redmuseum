import { Plus, LayoutList } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../_components/PageHeader";
import { Panel } from "../../_components/Panel";
import { EmptyState } from "../../_components/EmptyState";
import { LinkButton } from "../../_components/Button";
import { IntroForm } from "./IntroForm";
import { SectionList } from "./SectionList";
import { updateBiographyIntro } from "./actions";

export default async function AdminMuseumSectionsPage() {
  const supabase = createClient();
  const [{ data: intro }, { data: blocks, error: blocksError }] = await Promise.all([
    supabase.from("biography_intro").select("*").eq("id", 1).maybeSingle(),
    supabase.from("biography_blocks").select("*").order("sort_order", { ascending: true }),
  ]);

  const hasBlocks = (blocks?.length ?? 0) > 0;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="بەشەکانی مۆزەخانە"
        description="هەر بەشێک پەراگرافێک و کۆمەڵێک وێنە دەگرێتەخۆ. بە ڕاکێشان ڕیزبەندییان بگۆڕە."
      >
        <LinkButton href="/admin/museums/blocks/new">
          <Plus size={16} /> زیادکردنی بەش
        </LinkButton>
      </PageHeader>

      {blocksError && (
        <p className="rounded-xl bg-pigment-crimson/10 px-4 py-3 text-fluid-sm text-pigment-crimson">
          سەرکەوتوو نەبوو لە بارکردنی بەشەکان: {blocksError.message}
        </p>
      )}

      {!blocksError && !hasBlocks && (
        <EmptyState
          icon={LayoutList}
          title="هێشتا هیچ بەشێک نییە"
          description="ماڵپەڕ دەگەڕێتەوە بۆ پەراگرافە بنەڕەتییەکانی خۆی تا ئێرە بەشیان زیاد بکەیت."
        >
          <LinkButton href="/admin/museums/blocks/new">
            <Plus size={16} /> زیادکردنی یەکەم بەش
          </LinkButton>
        </EmptyState>
      )}

      {!blocksError && hasBlocks && <SectionList blocks={blocks ?? []} />}

      <Panel
        title="دەقی سەرەتای بەشەکان"
        description="پەراگرافی سەرەتا کە پێش لیستی بەشەکان دەردەکەوێت."
        collapsible
        defaultOpen={false}
      >
        <IntroForm action={updateBiographyIntro} intro={intro ?? null} />
      </Panel>
    </div>
  );
}
