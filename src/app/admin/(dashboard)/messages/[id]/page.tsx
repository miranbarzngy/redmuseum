import { notFound } from "next/navigation";
import { Phone } from "lucide-react";
import { DeleteButton } from "../../../_components/DeleteButton";
import { PageHeader } from "../../../_components/PageHeader";
import { Panel } from "../../../_components/Panel";
import { getMessage, deleteMessage } from "../actions";
import { formatMessageDate } from "../formatMessageDate";
import { MarkAsRead } from "../MarkAsRead";

export default async function AdminMessageDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const message = await getMessage(params.id);

  if (!message) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      {!message.is_read && <MarkAsRead id={message.id} />}

      <PageHeader
        title={message.name}
        backHref="/admin/messages"
        backLabel="گەڕانەوە بۆ پەیامەکان"
      />

      <Panel bodyClassName="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <a
            href={`tel:${message.phone}`}
            dir="ltr"
            className="inline-flex items-center gap-1.5 text-fluid-sm text-pigment-terracotta hover:underline"
          >
            <Phone size={14} /> {message.phone}
          </a>
          <div className="text-end text-fluid-xs text-ink-faint">
            {formatMessageDate(message.created_at)}
          </div>
        </div>

        <p className="whitespace-pre-wrap border-t border-ink/10 pt-6 text-fluid-base leading-relaxed text-ink">
          {message.message}
        </p>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
          <a
            href={`tel:${message.phone}`}
            className="font-kurdish inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
          >
            <Phone size={15} /> پەیوەندیکردن
          </a>
          <DeleteButton
            action={deleteMessage.bind(null, message.id)}
            confirmMessage="ئەم پەیامە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
          />
        </div>
      </Panel>
    </div>
  );
}
