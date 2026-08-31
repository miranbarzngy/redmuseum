import { PageHeader } from "../../../../_components/PageHeader";
import { BlockForm } from "../../BlockForm";
import { createBiographyBlock } from "../../actions";

export default function NewBiographyBlockPage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="زیادکردنی بەش"
        backHref="/admin/museums"
        backLabel="گەڕانەوە بۆ بەشەکان"
      />
      <BlockForm action={createBiographyBlock} />
    </div>
  );
}
