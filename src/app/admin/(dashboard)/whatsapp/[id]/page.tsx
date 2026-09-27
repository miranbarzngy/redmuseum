import { notFound } from "next/navigation";
import { PageHeader } from "../../../_components/PageHeader";
import { WhatsAppTemplateForm } from "../WhatsAppTemplateForm";
import { getWhatsAppTemplate, updateWhatsAppTemplate } from "../actions";

export default async function EditWhatsAppTemplatePage(props: { params: Promise<{ id: string }> }) {
  const { id } = await props.params;
  const template = await getWhatsAppTemplate(id);

  if (!template) notFound();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6 mb-24 lg:mb-0">
      <PageHeader title="دەستکاریکردنی پەیامی واتساپ" backHref="/admin/whatsapp" backLabel="گەڕانەوە بۆ پەیامەکان" />
      <WhatsAppTemplateForm action={updateWhatsAppTemplate.bind(null, template.id)} template={template} />
    </div>
  );
}
