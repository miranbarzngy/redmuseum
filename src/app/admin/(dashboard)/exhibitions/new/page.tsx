import { PageHeader } from "../../../_components/PageHeader";
import { ExhibitionForm } from "../ExhibitionForm";
import { createExhibition } from "../actions";

export default function NewExhibitionPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="زیادکردنی پێشانگا"
        backHref="/admin/exhibitions"
        backLabel="گەڕانەوە بۆ پێشانگاکان"
      />
      <ExhibitionForm action={createExhibition} />
    </div>
  );
}
