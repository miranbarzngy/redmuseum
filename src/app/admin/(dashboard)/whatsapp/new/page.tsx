import { PageHeader } from "../../../_components/PageHeader";
import { WhatsAppTemplateForm } from "../WhatsAppTemplateForm";
import { createWhatsAppTemplate } from "../actions";

export default function NewWhatsAppTemplatePage() {
  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 mb-24 lg:mb-0">
      <PageHeader title="زیادکردنی پەیامی واتساپ" backHref="/admin/whatsapp" backLabel="گەڕانەوە بۆ پەیامەکان" />
      <WhatsAppTemplateForm action={createWhatsAppTemplate} />
    </div>
  );
}
