import { MessageCircle, Plus } from "lucide-react";
import { listWhatsAppTemplates } from "./actions";
import { WhatsAppTemplateGrid } from "./WhatsAppTemplateGrid";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { LinkButton } from "../../_components/Button";

export default async function AdminWhatsAppPage() {
  const templates = await listWhatsAppTemplates();

  return (
    <div className="flex flex-col gap-8 mb-24 lg:mb-0">
      <PageHeader
        title="پەیامەکانی واتساپ"
        description="ئەو پەیامانەی لە لاپەڕەی سەردانەکانەوە بۆ واتساپی میوانان دەنێردرێن. یەکەمیان بە شێوەی بنەڕەت هەڵدەبژێردرێت؛ بە ڕاکێشان ڕیزبەندی بگۆڕە."
      />

      {templates.length === 0 ? (
        <EmptyState icon={MessageCircle} title="هێشتا هیچ پەیامێک نییە">
          <LinkButton href="/admin/whatsapp/new">
            <Plus size={16} /> زیادکردنی یەکەم پەیام
          </LinkButton>
        </EmptyState>
      ) : (
        <WhatsAppTemplateGrid templates={templates} />
      )}
    </div>
  );
}
