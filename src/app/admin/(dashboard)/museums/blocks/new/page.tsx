import { BlockForm } from "../../BlockForm";
import { createBiographyBlock } from "../../actions";

export default function NewBiographyBlockPage() {
  return (
    <div className="flex flex-col gap-6">
      <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">زیادکردنی بەشەکانی مۆزەخانە</h1>
      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <BlockForm action={createBiographyBlock} />
      </div>
    </div>
  );
}
