import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../_components/PageHeader";
import { GalleryForm } from "../GalleryForm";
import { createGalleryImage } from "../actions";

export default async function NewGalleryImagePage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("gallery_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader title="زیادکردنی وێنە" backHref="/admin/gallery" backLabel="گەڕانەوە بۆ گەلەری" />
      <GalleryForm action={createGalleryImage} categories={categories ?? []} />
    </div>
  );
}
