import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/PageHeader";
import { CategoryForm } from "../CategoryForm";
import { updateCategory } from "../actions";

export default async function EditGalleryCategoryPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: category } = await supabase
    .from("gallery_categories")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!category) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="دەستکاریکردنی پۆل"
        backHref="/admin/gallery-categories"
        backLabel="گەڕانەوە بۆ پۆلەکان"
      />
      <CategoryForm action={updateCategory.bind(null, category.id)} category={category} />
    </div>
  );
}
