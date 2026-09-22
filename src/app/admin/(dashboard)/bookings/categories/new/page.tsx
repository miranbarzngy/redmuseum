import { PageHeader } from "../../../../_components/PageHeader";
import { VisitorTypeForm } from "../VisitorTypeForm";
import { createVisitorType } from "../actions";

export default function NewBookingVisitorTypePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 mb-24 lg:mb-0">
      <PageHeader
        title="زیادکردنی جۆری سەردان"
        backHref="/admin/bookings/categories"
        backLabel="گەڕانەوە بۆ جۆرەکان"
      />
      <VisitorTypeForm action={createVisitorType} />
    </div>
  );
}
