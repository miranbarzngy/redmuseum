import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PressForm } from "../PressForm";
import { updatePressItem } from "../actions";

export default async function EditPressItemPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const [{ data: item }, { data: categories }] = await Promise.all([
    supabase.from("press_media").select("*").eq("id", params.id).single(),
    supabase.from("press_categories").select("*").order("sort_order", { ascending: true }),
  ]);

  if (!item) notFound();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">دەستکاریکردنی بابەتی میدیا</h1>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <PressForm
          action={updatePressItem.bind(null, item.id)}
          item={item}
          categories={categories ?? []}
        />
      </div>
    </div>
  );
}
