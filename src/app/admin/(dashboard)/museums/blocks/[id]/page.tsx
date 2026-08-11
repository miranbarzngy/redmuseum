import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <div className="flex flex-col gap-6">
      <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">دەستکاریکردنی بەشەکانی مۆزەخانە</h1>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <BlockForm action={updateBiographyBlock.bind(null, block.id)} block={block} />
      </div>
    </div>
  );
}
