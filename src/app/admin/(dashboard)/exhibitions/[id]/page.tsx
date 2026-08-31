import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/PageHeader";
import { ExhibitionForm } from "../ExhibitionForm";
import { updateExhibition } from "../actions";

export default async function EditExhibitionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: exhibition } = await supabase
    .from("exhibitions")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!exhibition) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="دەستکاریکردنی پێشانگا"
        backHref="/admin/exhibitions"
        backLabel="گەڕانەوە بۆ پێشانگاکان"
      />
      <ExhibitionForm action={updateExhibition.bind(null, exhibition.id)} exhibition={exhibition} />
    </div>
  );
}
