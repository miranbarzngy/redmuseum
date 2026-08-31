import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/PageHeader";
import { GalleryForm } from "../GalleryForm";
import { updateGalleryImage } from "../actions";

export default async function EditGalleryImagePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from("gallery").select("*").eq("id", params.id).single(),
    supabase.from("gallery_categories").select("*").order("sort_order", { ascending: true }),
  ]);

  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="دەستکاریکردنی وێنە" backHref="/admin/gallery" backLabel="گەڕانەوە بۆ گەلەری" />
      <GalleryForm
        action={updateGalleryImage.bind(null, item.id)}
        item={item}
        categories={categories ?? []}
      />
    </div>
  );
}
