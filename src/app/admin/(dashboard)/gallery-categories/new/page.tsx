import { PageHeader } from "../../../_components/PageHeader";
import { CategoryForm } from "../CategoryForm";
import { createCategory } from "../actions";

export default function NewGalleryCategoryPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="زیادکردنی پۆل"
        backHref="/admin/gallery-categories"
        backLabel="گەڕانەوە بۆ پۆلەکان"
      />
      <CategoryForm action={createCategory} />
    </div>
  );
}
