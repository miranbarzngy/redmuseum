import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Phone } from "lucide-react";
import { DeleteButton } from "../../../_components/DeleteButton";
import { getMessage, deleteMessage } from "../actions";
import { formatMessageDate } from "../formatMessageDate";
import { MarkAsRead } from "../MarkAsRead";

const TYPE_LABELS: Record<string, string> = {
  commission: "داواکاری کاری تایبەت",
  media: "ڕۆژنامەوانی / میدیا",
  other: "هیتر",
};

export default async function AdminMessageDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const message = await getMessage(params.id);

  if (!message) notFound();

  return (
    <div className="flex flex-col gap-6">
      {!message.is_read && <MarkAsRead id={message.id} />}

      <Link
        href="/admin/messages"
        className="inline-flex w-fit items-center gap-1.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:text-pigment-terracotta"
      >
        <ArrowRight size={16} /> گەڕانەوە بۆ پەیامەکان
      </Link>

      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-6">
          <div>
            <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">{message.name}</h1>
            <a
              href={`tel:${message.phone}`}
              className="mt-1 inline-flex items-center gap-1.5 text-fluid-sm text-pigment-terracotta hover:underline"
            >
              <Phone size={14} /> {message.phone}
            </a>
          </div>
          <div className="text-end text-fluid-xs text-ink-faint">
            <div>{TYPE_LABELS[message.type] ?? message.type}</div>
            <div className="mt-1">{formatMessageDate(message.created_at)}</div>
          </div>
        </div>

        <p className="whitespace-pre-wrap py-6 text-fluid-base leading-relaxed text-ink">
          {message.message}
        </p>

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
          <a
            href={`tel:${message.phone}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
          >
            <Phone size={15} /> پەیوەندیکردن
          </a>
          <DeleteButton
            action={deleteMessage.bind(null, message.id)}
            confirmMessage="ئەم پەیامە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
          />
        </div>
      </div>
    </div>
  );
}
