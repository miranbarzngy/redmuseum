import { CategoryForm } from "../CategoryForm";
import { createCategory } from "../actions";

export default function NewPressCategoryPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">زیادکردنی پۆل</h1>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <CategoryForm action={createCategory} />
      </div>
    </div>
  );
}
