"use client";

import { useState, useTransition } from "react";
import { History, Loader2 } from "lucide-react";
import clsx from "clsx";
import { ConfirmDialog } from "../../_components/ConfirmDialog";
import { useToast } from "../../_components/Toast";
import { slidingIndicatorMotion, useSlidingIndicator } from "../../_components/useSlidingIndicator";
import type { AuditLogRetention } from "@/lib/supabase/database.types";
import { updateAuditLogRetention } from "./actions";
import { AUDIT_RETENTION_OPTIONS } from "./retention";

const LABEL = "ماوەی هەڵگرتنی تۆمارەکان";

function optionFor(value: AuditLogRetention) {
  return AUDIT_RETENTION_OPTIONS.find((option) => option.value === value) ?? AUDIT_RETENTION_OPTIONS[2];
}

/** How long the audit log keeps entries: a segmented control in the page
 * header that saves on tap. A shorter period deletes everything older right
 * away, so it asks first; a longer one just saves. Shown read-only to admins
 * without settings:manage (see updateAuditLogRetention). */
export function AuditLogRetentionControl({
  initial,
  canManage,
}: {
  initial: AuditLogRetention;
  canManage: boolean;
}) {
  const [retention, setRetention] = useState(initial);
  const [awaitingConfirm, setAwaitingConfirm] = useState<AuditLogRetention | null>(null);
  const [saving, startSaving] = useTransition();
  const toast = useToast();
  const { containerRef, indicatorRef } = useSlidingIndicator<HTMLDivElement, HTMLSpanElement>(retention);

  function save(next: AuditLogRetention) {
    const prev = retention;
    setRetention(next);
    startSaving(async () => {
      const result = await updateAuditLogRetention(next).catch(() => ({ ok: false as const }));
      if (!result.ok) {
        setRetention(prev);
        toast.show("پاشەکەوتکردن سەرکەوتوو نەبوو", "error");
        return;
      }
      toast.show(result.deleted > 0 ? `پاشەکەوتکرا · ${result.deleted} تۆمار سڕایەوە` : "پاشەکەوتکرا");
    });
  }

  function select(next: AuditLogRetention) {
    if (!canManage || saving || next === retention) return;
    if (optionFor(next).days < optionFor(retention).days) setAwaitingConfirm(next);
    else save(next);
  }

  return (
    <div className="flex flex-col gap-1.5">
      <span className="font-kurdish flex items-center gap-1.5 text-fluid-xs font-medium text-ink-soft">
        <History size={13} />
        {LABEL}
        {saving && <Loader2 size={12} className="animate-spin" />}
      </span>

      <div
        ref={containerRef}
        role="radiogroup"
        aria-label={LABEL}
        className="group/pill relative flex items-center gap-1 self-start rounded-full bg-white/70 p-1 shadow-[0_1px_2px_rgba(28,27,25,0.05)] ring-1 ring-inset ring-ink/10 backdrop-blur-sm"
      >
        <span
          ref={indicatorRef}
          aria-hidden
          className={clsx(
            "pointer-events-none absolute left-0 top-0 rounded-full bg-brand-fill opacity-0 shadow-brand",
            slidingIndicatorMotion
          )}
        />
        {AUDIT_RETENTION_OPTIONS.map((option) => {
          const active = option.value === retention;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={active}
              data-active={active}
              disabled={!canManage}
              onClick={() => select(option.value)}
              className={clsx(
                "font-kurdish relative whitespace-nowrap rounded-full px-3 py-1.5 text-fluid-xs font-medium transition-[color,background-color,box-shadow,transform] duration-300 ease-spring",
                canManage ? "active:scale-95" : "cursor-default",
                active
                  ? "bg-brand-fill text-white shadow-brand group-data-[pill=ready]/pill:bg-none group-data-[pill=ready]/pill:shadow-none"
                  : clsx("text-ink-soft", canManage && "hover:text-ink")
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>

      {!canManage && (
        <span className="font-kurdish text-[11px] text-ink-faint">
          تەنها بەکارهێنەری خاوەن دەسەڵاتی ڕێکخستنەکان دەتوانێت بیگۆڕێت.
        </span>
      )}

      <ConfirmDialog
        open={awaitingConfirm !== null}
        title="کورتکردنەوەی ماوەی هەڵگرتن"
        message={`هەموو تۆمارێکی کۆنتر لە ${awaitingConfirm ? optionFor(awaitingConfirm).label : ""} ئێستا دەسڕدرێتەوە و ناگەڕێتەوە. لەمەودوا ڕۆژانە بە شێوەی خۆکار دەسڕدرێنەوە.`}
        onConfirm={() => {
          const next = awaitingConfirm;
          setAwaitingConfirm(null);
          if (next) save(next);
        }}
        onCancel={() => setAwaitingConfirm(null)}
      />
    </div>
  );
}
