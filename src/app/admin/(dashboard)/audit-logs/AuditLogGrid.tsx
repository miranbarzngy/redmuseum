"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { DataList, type Column } from "../../_components/DataList";
import { RowCard } from "../../_components/RowCard";
import { StatusBadge } from "../../_components/StatusBadge";
import { formatMessageDate } from "../messages/formatMessageDate";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import type { AdminAuditLogRow } from "@/lib/supabase/database.types";

function ViewButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="بینینی وردەکاری"
      className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-ink/10 text-ink-faint transition-colors hover:border-pigment-terracotta hover:text-pigment-terracotta"
    >
      <Eye size={15} />
    </button>
  );
}

/** Audit rows are dense tabular data being scanned/compared — the opposite
 * of the image-forward content that motivated the Gallery/Event/Section
 * card-grid refactor — so this is built on the existing DataList/RowCard
 * hybrid (real <table> at md+, stacked cards below) rather than that
 * pattern, despite the "Grid" name. */
export function AuditLogGrid({ logs }: { logs: AdminAuditLogRow[] }) {
  const [selected, setSelected] = useState<AdminAuditLogRow | null>(null);

  const columns: Column<AdminAuditLogRow>[] = [
    {
      key: "created_at",
      header: "کات",
      cell: (r) => <span dir="ltr">{formatMessageDate(r.created_at)}</span>,
    },
    {
      key: "user_email",
      header: "بەکارهێنەر",
      cell: (r) => <span dir="ltr">{r.user_email}</span>,
    },
    {
      key: "action",
      header: "کردار",
      cell: (r) => <StatusBadge tone="accent">{r.action}</StatusBadge>,
    },
    {
      key: "target",
      header: "ئامانج",
      cell: (r) => (
        <span dir="ltr" className="text-ink-faint">
          {r.target_entity}
          {r.target_id ? ` · ${r.target_id.slice(0, 8)}` : ""}
        </span>
      ),
    },
    {
      key: "ip",
      header: "ئای‌پی",
      cell: (r) => (
        <span dir="ltr" className="text-ink-faint">
          {r.ip_address ?? "—"}
        </span>
      ),
    },
    {
      key: "view",
      header: "",
      align: "end",
      cell: (r) => <ViewButton onClick={() => setSelected(r)} />,
    },
  ];

  return (
    <>
      <DataList
        rows={logs}
        columns={columns}
        rowKey={(r) => r.id}
        renderCard={(r) => (
          <RowCard
            title={<span dir="ltr">{r.user_email}</span>}
            meta={<span dir="ltr">{formatMessageDate(r.created_at)} · {r.action}</span>}
            badges={<StatusBadge tone="accent">{r.target_entity}</StatusBadge>}
            actions={<ViewButton onClick={() => setSelected(r)} />}
          />
        )}
      />
      <AuditLogDetailModal log={selected} onClose={() => setSelected(null)} />
    </>
  );
}
