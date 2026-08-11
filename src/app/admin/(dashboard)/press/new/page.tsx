import { createClient } from "@/lib/supabase/server";
import { PressForm } from "../PressForm";
import { createPressItem } from "../actions";

export default async function NewPressItemPage() {
  const supabase = createClient();
  const { data: categories } = await supabase
    .from("press_categories")
    .select("*")
    .order("sort_order", { ascending: true });

  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">زیادکردنی بابەتی میدیا</h1>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <PressForm action={createPressItem} categories={categories ?? []} />
      </div>
    </div>
  );
}
