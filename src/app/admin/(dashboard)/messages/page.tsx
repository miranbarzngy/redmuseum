import { Inbox } from "lucide-react";
import { getMessages, markAllMessagesRead } from "./actions";
import { MessageGrid } from "./MessageGrid";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { FilterTabs, type FilterOption } from "../../_components/FilterTabs";
import { btnSecondary } from "../../_components/Button";

export default async function AdminMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const messages = await getMessages();
  const unreadCount = messages.filter((m) => !m.is_read).length;

  const options: FilterOption[] = [
    { value: "all", label: "هەموو", count: messages.length },
    { value: "unread", label: "نەخوێندراوە", count: unreadCount },
  ];
  const visible = filter === "unread" ? messages.filter((m) => !m.is_read) : messages;

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="پەیامەکان"
        description="پەیامەکانی پەیوەندی لە فۆرمی «بەشی»ی ماڵپەڕی گشتییەوە."
      >
        {unreadCount > 0 && (
          <form action={markAllMessagesRead}>
            <button type="submit" className={btnSecondary}>
              هەموو وەک خوێندراوە دابنێ
            </button>
          </form>
        )}
      </PageHeader>

      {messages.length > 0 && <FilterTabs param="filter" options={options} defaultValue="all" />}

      {visible.length === 0 ? (
        <EmptyState
          icon={Inbox}
          title={messages.length === 0 ? "هێشتا هیچ پەیامێک نییە" : "هیچ پەیامێکی نەخوێندراو نییە"}
        />
      ) : (
        <MessageGrid messages={visible} />
      )}
    </div>
  );
}
