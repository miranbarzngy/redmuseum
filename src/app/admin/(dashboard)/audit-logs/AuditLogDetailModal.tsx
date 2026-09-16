"use client";

import clsx from "clsx";
import { Modal } from "../../_components/Modal";
import { formatMessageDate } from "../messages/formatMessageDate";
import { describeAuditAction, describeAuditTargetPrefix } from "./actionLabels";
import type { AdminAuditLogRow } from "@/lib/supabase/database.types";

type AuditLogWithUserName = AdminAuditLogRow & { user_name: string; target_label: string | null };

/** Same prefix + label logic as AuditLogGrid's TargetCell. */
function TargetSummary({ log }: { log: AuditLogWithUserName }) {
  const prefix = describeAuditTargetPrefix(log);
  return (
    <>
      {prefix}
      {log.target_label ? (
        <span>{prefix ? " · " : ""}{log.target_label}</span>
      ) : log.target_id ? (
        <span dir="ltr"> · {log.target_id.slice(0, 8)}</span>
      ) : null}
    </>
  );
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") return "—";
  if (typeof value === "boolean") return value ? "بەڵێ" : "نەخێر";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

/** Field-by-field before/after table, not a raw JSON dump — one row per
 * changed-or-present field, with changed values highlighted. Never shows
 * anything with "hash" in the key (password_hash never lands here anyway,
 * since the actions.ts writers select it out before logging, but this is a
 * second line of defence). */
function DiffTable({ before, after }: { before: unknown; after: unknown }) {
  const beforeObj = (before && typeof before === "object" ? before : {}) as Record<string, unknown>;
  const afterObj = (after && typeof after === "object" ? after : {}) as Record<string, unknown>;
  const keys = Array.from(new Set([...Object.keys(afterObj), ...Object.keys(beforeObj)])).filter(
    (k) => !k.toLowerCase().includes("hash") && formatValue(beforeObj[k]) !== formatValue(afterObj[k])
  );

  if (keys.length === 0) {
    return <p className="font-kurdish text-fluid-sm text-ink-faint">هیچ گۆڕانکارییەک نەبووە.</p>;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-ink/10">
      <table className="w-full border-collapse text-fluid-xs">
        <thead>
          <tr className="border-b border-ink/10 bg-canvas-paper">
            <th className="font-kurdish px-3 py-2 text-right font-medium text-ink-faint">خانە</th>
            <th className="font-kurdish px-3 py-2 text-right font-medium text-ink-faint">پێش</th>
            <th className="font-kurdish px-3 py-2 text-right font-medium text-ink-faint">پاش</th>
          </tr>
        </thead>
        <tbody>
          {keys.map((key) => {
            const beforeVal = formatValue(beforeObj[key]);
            const afterVal = formatValue(afterObj[key]);
            const changed = beforeVal !== afterVal;
            return (
              <tr key={key} className={clsx("border-b border-ink/5 last:border-0", changed && "bg-[#850B10]/[0.04]")}>
                <td dir="ltr" className="px-3 py-2 text-right align-top font-medium text-ink-soft">
                  {key}
                </td>
                <td dir="ltr" className="max-w-[9rem] break-all px-3 py-2 text-right align-top text-ink-faint">
                  {changed ? <span className="line-through">{beforeVal}</span> : beforeVal}
                </td>
                <td
                  dir="ltr"
                  className={clsx(
                    "max-w-[9rem] break-all px-3 py-2 text-right align-top",
                    changed ? "font-semibold text-[#850B10]" : "text-ink"
                  )}
                >
                  {afterVal}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Before/after diff drawer for one admin_audit_logs row, built on the
 * shared Modal shell. */
export function AuditLogDetailModal({
  log,
  onClose,
}: {
  log: AuditLogWithUserName | null;
  onClose: () => void;
}) {
  return (
    <Modal
      open={log !== null}
      title={log ? describeAuditAction(log) : ""}
      onClose={onClose}
      widthClassName="max-w-2xl"
    >
      {log && (
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-3 text-fluid-xs text-ink-faint sm:grid-cols-4">
            <div>
              <span className="font-kurdish block text-ink-soft">بەکارهێنەر</span>
              <span>{log.user_name}</span>
            </div>
            <div>
              <span className="font-kurdish block text-ink-soft">کات</span>
              <span dir="ltr">{formatMessageDate(log.created_at)}</span>
            </div>
            <div>
              <span className="font-kurdish block text-ink-soft">ئامانج</span>
              <TargetSummary log={log} />
            </div>
            <div>
              <span className="font-kurdish block text-ink-soft">ئای‌پی</span>
              <span dir="ltr">{log.ip_address ?? "—"}</span>
            </div>
          </div>
          <DiffTable before={log.details?.before} after={log.details?.after} />
        </div>
      )}
    </Modal>
  );
}
