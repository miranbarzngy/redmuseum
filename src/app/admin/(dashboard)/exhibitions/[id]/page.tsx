import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
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
    <div className="flex flex-col gap-6">
      <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">دەستکاریکردنی پێشانگا</h1>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <ExhibitionForm action={updateExhibition.bind(null, exhibition.id)} exhibition={exhibition} />
      </div>
    </div>
  );
}
