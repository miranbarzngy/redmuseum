"use client";

import { useMemo, useState, useTransition } from "react";
import clsx from "clsx";
import { CheckCheck, Loader2, Inbox as InboxIcon, Search } from "lucide-react";
import { PageHeader } from "../../_components/PageHeader";
import { EmptyState } from "../../_components/EmptyState";
import { fieldControlClass } from "../../_components/Field";
import { useToast } from "../../_components/Toast";
import { MessageCard } from "./MessageCard";
import { MessageDrawer } from "./MessageDrawer";
import { markAllMessagesRead, markMessageRead } from "./actions";
import type { ContactMessageRow } from "@/lib/supabase/database.types";

type TabKey = "all" | "unread" | "read";

const TABS: { key: TabKey; label: string }[] = [
  { key: "all", label: "هەموو" },
  { key: "unread", label: "نەخوێندراوە" },
  { key: "read", label: "خوێندراوە" },
];

/**
 * The messages route's whole interactive surface: toolbar (counts, mark-all,
 * tabs, search) + card list + detail drawer. Everything filters client-side
 * over the full `messages` list the server already loads — there's no
 * pagination to fight, so this stays simple instead of wiring up URL state.
 *
 * `messages` is mirrored into local state so read/delete can update the UI
 * immediately instead of waiting on the round trip. It resyncs whenever the
 * server action's revalidatePath() delivers a fresh `messages` prop — via
 * the "adjust state during render" pattern (comparing against the previous
 * prop, not an effect) so local state never permanently drifts from the DB.
 */
export function MessagesInbox({
  messages: initialMessages,
  initialOpenId,
}: {
  messages: ContactMessageRow[];
  initialOpenId: string | null;
}) {
  const [messages, setMessages] = useState(initialMessages);
  const [prevInitialMessages, setPrevInitialMessages] = useState(initialMessages);
  if (initialMessages !== prevInitialMessages) {
    setPrevInitialMessages(initialMessages);
    setMessages(initialMessages);
  }

  const [tab, setTab] = useState<TabKey>("all");
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState<string | null>(() =>
    initialOpenId && initialMessages.some((m) => m.id === initialOpenId) ? initialOpenId : null,
  );
  const [isMarkingAll, startMarkingAll] = useTransition();
  const [, startMarkRead] = useTransition();
  const toast = useToast();

  const total = messages.length;
  const unreadCount = messages.filter((m) => !m.is_read).length;
  const readCount = total - unreadCount;
  const selected = messages.find((m) => m.id === selectedId) ?? null;

  const filtered = useMemo(() => {
    let list = messages;
    if (tab === "unread") list = list.filter((m) => !m.is_read);
    else if (tab === "read") list = list.filter((m) => m.is_read);

    const needle = query.trim().toLowerCase();
    if (needle) {
      const digits = needle.replace(/\D/g, "");
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(needle) ||
          m.message.toLowerCase().includes(needle) ||
          m.phone.includes(needle) ||
          (digits.length > 0 && m.phone.replace(/\D/g, "").includes(digits)),
      );
    }
    return list;
  }, [messages, tab, query]);

  function markRead(id: string) {
    setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_read: true } : m)));
    startMarkRead(async () => {
      await markMessageRead(id);
    });
  }

  function handleOpen(message: ContactMessageRow) {
    setSelectedId(message.id);
    if (!message.is_read) markRead(message.id);
  }

  function handleMarkAllRead() {
    if (unreadCount === 0) return;
    setMessages((prev) => prev.map((m) => ({ ...m, is_read: true })));
    startMarkingAll(async () => {
      await markAllMessagesRead();
      toast.show("هەموو پەیامەکان وەک خوێندراو نیشانکران.");
    });
  }

  return (
    <div className="flex flex-col gap-6 mb-24 lg:mb-0">
      <PageHeader
        title="پەیامەکان"
        description={
          total === 0
            ? "هێشتا هیچ پەیامێک نییە."
            : unreadCount > 0
              ? `${total} پەیام · ${unreadCount} نەخوێندراوە`
              : `${total} پەیام · هەموو خوێندراونەتەوە`
        }
      >
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={handleMarkAllRead}
            disabled={isMarkingAll}
            className="font-kurdish inline-flex items-center justify-center gap-1.5 rounded-full border border-ink/15 px-4 py-2.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:border-emerald-500/50 hover:text-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isMarkingAll ? <Loader2 size={15} className="animate-spin" /> : <CheckCheck size={15} />}
            هەموو وەک خوێندراو دابنێ
          </button>
        )}
      </PageHeader>

      {total > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-2">
            {TABS.map((t) => {
              const count = t.key === "all" ? total : t.key === "unread" ? unreadCount : readCount;
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={clsx(
                    "font-kurdish inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-fluid-xs font-medium transition-colors",
                    active
                      ? "bg-[#850B10] text-canvas"
                      : "border border-ink/15 text-ink-soft hover:border-pigment-terracotta hover:text-pigment-terracotta",
                  )}
                >
                  {t.label}
                  <span
                    className={clsx(
                      "rounded-full px-1.5 text-[10px] font-semibold",
                      active ? "bg-canvas/20 text-canvas" : "bg-ink/10 text-ink-soft",
                    )}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="relative w-full sm:w-72">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="گەڕان بە ناو، ژمارە یان ناوەڕۆکی پەیام..."
              className={clsx(fieldControlClass, "ps-9")}
            />
            <Search size={14} className="absolute start-3 top-1/2 -translate-y-1/2 text-ink-faint" />
          </div>
        </div>
      )}

      {total === 0 ? (
        <EmptyState icon={InboxIcon} title="هێشتا هیچ پەیامێک نییە" />
      ) : filtered.length === 0 ? (
        <EmptyState icon={Search} title="هیچ پەیامێک نەدۆزرایەوە" description="فلتەر یان وشەی گەڕان بگۆڕە." />
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filtered.map((m) => (
            <MessageCard
              key={m.id}
              message={m}
              active={m.id === selectedId}
              onOpen={() => handleOpen(m)}
              onMarkRead={() => markRead(m.id)}
            />
          ))}
        </div>
      )}

      <MessageDrawer message={selected} onClose={() => setSelectedId(null)} />
    </div>
  );
}
