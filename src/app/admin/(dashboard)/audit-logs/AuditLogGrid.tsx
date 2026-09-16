"use client";

import { useState } from "react";
import { Eye } from "lucide-react";
import { DataList, type Column } from "../../_components/DataList";
import { RowCard } from "../../_components/RowCard";
import { StatusBadge } from "../../_components/StatusBadge";
import { formatMessageDate } from "../messages/formatMessageDate";
import { AuditLogDetailModal } from "./AuditLogDetailModal";
import { describeAuditAction, describeAuditTargetPrefix } from "./actionLabels";
import type { AdminAuditLogRow } from "@/lib/supabase/database.types";

type AuditLogWithUserName = AdminAuditLogRow & { user_name: string; target_label: string | null };

/** "ئامانج" cell content: a prefix (entity label, or a diff-aware override,
 * or nothing — see describeAuditTargetPrefix) plus whatever's more useful
 * than the raw UUID: the resolved name when there is one (target_label,
 * set in page.tsx), else the id's first 8 chars. */
function TargetCell({ log }: { log: AuditLogWithUserName }) {
  const prefix = describeAuditTargetPrefix(log);
  return (
    <span className="text-ink-faint">
      {prefix}
      {log.target_label ? (
        <span>{prefix ? " · " : ""}{log.target_label}</span>
      ) : log.target_id ? (
        <span dir="ltr"> · {log.target_id.slice(0, 8)}</span>
      ) : null}
    </span>
  );
}

/** Same prefix + label logic as TargetCell, flattened to plain text for the
 * mobile card's single-line badge (which never fell back to the raw id). */
function targetBadgeText(log: AuditLogWithUserName): string {
  const prefix = describeAuditTargetPrefix(log);
  if (log.target_label) return prefix ? `${prefix} · ${log.target_label}` : log.target_label;
  return prefix ?? "";
}

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
export function AuditLogGrid({ logs }: { logs: AuditLogWithUserName[] }) {
  const [selected, setSelected] = useState<AuditLogWithUserName | null>(null);

  const columns: Column<AuditLogWithUserName>[] = [
    {
      key: "created_at",
      header: "کات",
      cell: (r) => <span dir="ltr">{formatMessageDate(r.created_at)}</span>,
    },
    {
      key: "user_name",
      header: "بەکارهێنەر",
      cell: (r) => <span>{r.user_name}</span>,
    },
    {
      key: "action",
      header: "کردار",
      cell: (r) => <StatusBadge tone="accent">{describeAuditAction(r)}</StatusBadge>,
    },
    {
      key: "target",
      header: "ئامانج",
      cell: (r) => <TargetCell log={r} />,
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
            title={<span>{r.user_name}</span>}
            meta={
              <span>
                <span dir="ltr">{formatMessageDate(r.created_at)}</span> · {describeAuditAction(r)}
              </span>
            }
            badges={<StatusBadge tone="accent">{targetBadgeText(r)}</StatusBadge>}
            actions={<ViewButton onClick={() => setSelected(r)} />}
          />
        )}
      />
      <AuditLogDetailModal log={selected} onClose={() => setSelected(null)} />
    </>
  );
}
