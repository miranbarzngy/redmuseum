import Link from "next/link";
import clsx from "clsx";
import { Inbox } from "lucide-react";
import { getMessages, markAllMessagesRead } from "./actions";
import { formatMessageDate } from "./formatMessageDate";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { DataList, type Column } from "../../_components/DataList";
import { RowCard } from "../../_components/RowCard";
import { FilterTabs, type FilterOption } from "../../_components/FilterTabs";
import { btnSecondary } from "../../_components/Button";
import type { ContactMessageRow } from "@/lib/supabase/database.types";

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

  const nameCell = (m: ContactMessageRow) => (
    <Link
      href={`/admin/messages/${m.id}`}
      className={clsx(
        "transition-colors hover:text-pigment-terracotta",
        m.is_read ? "font-medium text-ink" : "font-semibold text-ink"
      )}
    >
      {m.name}{" "}
      <span dir="ltr" className="font-normal text-ink-faint">
        · {m.phone}
      </span>
    </Link>
  );

  const columns: Column<ContactMessageRow>[] = [
    {
      key: "unread",
      header: "",
      className: "w-8",
      cell: (m) =>
        !m.is_read ? (
          <span
            className="block h-2 w-2 rounded-full bg-pigment-terracotta"
            aria-label="نەخوێندراوە"
          />
        ) : null,
    },
    { key: "name", header: "ناو", className: "w-56", cell: nameCell },
    {
      key: "message",
      header: "پەیام",
      cell: (m) => <span className="line-clamp-1 text-fluid-xs text-ink-faint">{m.message}</span>,
    },
    {
      key: "date",
      header: "بەروار",
      align: "end",
      className: "w-32",
      cell: (m) => <span className="text-fluid-xs text-ink-faint">{formatMessageDate(m.created_at)}</span>,
    },
  ];

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
        <DataList
          rows={visible}
          columns={columns}
          rowKey={(m) => m.id}
          rowClassName={(m) => (!m.is_read ? "bg-pigment-terracotta/[0.04]" : undefined)}
          renderCard={(m) => (
            <RowCard
              className={!m.is_read ? "border-pigment-terracotta/30" : undefined}
              leading={
                <span
                  className={clsx(
                    "h-2 w-2 shrink-0 rounded-full",
                    !m.is_read && "bg-pigment-terracotta"
                  )}
                />
              }
              title={nameCell(m)}
              meta={m.message}
              badges={
                <span className="text-fluid-xs text-ink-faint">
                  {formatMessageDate(m.created_at)}
                </span>
              }
            />
          )}
        />
      )}
    </div>
  );
}
