import Link from "next/link";
import { Circle } from "lucide-react";
import { getMessages } from "./actions";
import { formatMessageDate } from "./formatMessageDate";

const TYPE_LABELS: Record<string, string> = {
  commission: "داواکاری کاری تایبەت",
  media: "ڕۆژنامەوانی / میدیا",
  other: "هیتر",
};

export default async function AdminMessagesPage() {
  const messages = await getMessages();
  const unreadCount = messages.filter((m) => !m.is_read).length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">پەیامەکان</h1>
        <p className="mt-1 text-fluid-sm text-ink-soft">
          پەیامەکانی پەیوەندی لە فۆرمی «بەشی»ی ماڵپەڕی گشتییەوە.
          {unreadCount > 0 && ` — ${unreadCount} پەیامی نەخوێندراوە.`}
        </p>
      </div>

      {messages.length === 0 && (
        <p className="text-fluid-sm text-ink-faint">هێشتا هیچ پەیامێک نییە.</p>
      )}

      <div className="flex flex-col gap-3">
        {messages.map((m) => (
          <Link
            key={m.id}
            href={`/admin/messages/${m.id}`}
            className="flex items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card transition-colors hover:border-pigment-terracotta/40"
          >
            <span className="flex h-6 w-6 shrink-0 items-center justify-center">
              {!m.is_read && <Circle size={9} className="fill-pigment-terracotta text-pigment-terracotta" />}
            </span>
            <div className="min-w-0 flex-1">
              <div
                className={`truncate text-fluid-sm text-ink ${m.is_read ? "font-medium" : "font-semibold"}`}
              >
                {m.name} <span className="font-normal text-ink-faint">· {m.phone}</span>
              </div>
              <div className="truncate text-fluid-xs text-ink-faint">{m.message}</div>
            </div>
            <div className="hidden shrink-0 text-fluid-xs text-ink-faint sm:block">
              {TYPE_LABELS[m.type] ?? m.type}
            </div>
            <div className="w-32 shrink-0 text-end text-fluid-xs text-ink-faint">
              {formatMessageDate(m.created_at)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
