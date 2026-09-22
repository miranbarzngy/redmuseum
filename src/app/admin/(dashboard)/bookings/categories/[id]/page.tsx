import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "../../../../_components/PageHeader";
import { VisitorTypeForm } from "../VisitorTypeForm";
import { updateVisitorType } from "../actions";

export default async function EditBookingVisitorTypePage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const supabase = createClient();
  const { data: category } = await supabase
    .from("booking_visitor_types")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!category) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 mb-24 lg:mb-0">
      <PageHeader
        title="دەستکاریکردنی جۆری سەردان"
        backHref="/admin/bookings/categories"
        backLabel="گەڕانەوە بۆ جۆرەکان"
      />
      <VisitorTypeForm action={updateVisitorType.bind(null, category.id)} category={category} />
    </div>
  );
}
