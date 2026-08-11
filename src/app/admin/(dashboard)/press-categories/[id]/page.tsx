import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { CategoryForm } from "../CategoryForm";
import { updateCategory } from "../actions";

export default async function EditPressCategoryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: category } = await supabase
    .from("press_categories")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!category) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">دەستکاریکردنی پۆل</h1>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <CategoryForm action={updateCategory.bind(null, category.id)} category={category} />
      </div>
    </div>
  );
}
