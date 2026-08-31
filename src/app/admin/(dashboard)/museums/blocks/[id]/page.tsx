import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../../_components/PageHeader";
import { BlockForm } from "../../BlockForm";
import { updateBiographyBlock } from "../../actions";

export default async function EditBiographyBlockPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: block } = await supabase
    .from("biography_blocks")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!block) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="دەستکاریکردنی بەش"
        backHref="/admin/museums"
        backLabel="گەڕانەوە بۆ بەشەکان"
      />
      <BlockForm action={updateBiographyBlock.bind(null, block.id)} block={block} />
    </div>
  );
}
