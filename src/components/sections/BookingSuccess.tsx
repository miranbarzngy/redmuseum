"use client";

import { useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { toPng } from "html-to-image";
import { CheckCircle2, Download, ExternalLink, Loader2, RotateCcw } from "lucide-react";
import { easeArt } from "@/lib/motionVariants";
import { BookingQr } from "@/components/BookingQr";
import { BrandLockup } from "@/components/BrandLockup";

// Deliberately plain ASCII digits + AM/PM, not localizeDigits — this
// timestamp reads as a compact machine-style stamp (like a receipt), so it
// stays in Western numerals/12-hour form regardless of locale. Time and
// date are returned separately so the display can stack them (time above
// date), rather than one long inline string.
function timestampNow(): { time: string; date: string } {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  const hours24 = d.getHours();
  const period = hours24 < 12 ? "AM" : "PM";
  const hours12 = ((hours24 + 11) % 12) + 1;
  return {
    time: `${pad(hours12)}:${pad(d.getMinutes())} ${period}`,
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
  };
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase() || "؟";
}

export interface BookingConfirmation {
  token: string;
  reference: string;
  name: string;
  phone: string;
  guests: number;
  visitorTypeLabel: string;
  visitWeekday: string;
  visitDayMonth: string;
  timeLabel: string;
  note: string;
}

function Row({ label, value, ltr = false }: { label: string; value: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-ink/5 py-3 last:border-0">
      <dt className="shrink-0 text-fluid-xs font-medium text-ink-faint">{label}</dt>
      <dd className="text-end text-fluid-sm font-medium text-ink" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

/**
 * Visit-pass style booking confirmation: museum lockup + red rule, a
 * status/reference badge pair, a 2-column avatar+QR / details layout, and a
 * guidelines list. `passRef` wraps only the pass itself (not the actions
 * row below it), so "download as image" captures a clean card with nothing
 * extra baked in.
 */
export function BookingSuccess({
  confirmation,
  locale,
  onReset,
}: {
  confirmation: BookingConfirmation;
  locale: string;
  onReset: () => void;
}) {
  const t = useTranslations("booking");
  const statusPath = `/${locale}/booking/${confirmation.token}`;
  const guidelines = t.raw("print.guidelines") as string[];
  const passRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  // Captured once, when the confirmation first renders — effectively the
  // submission moment.
  const submittedAt = useMemo(() => timestampNow(), []);

  async function handleDownload() {
    if (!passRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await toPng(passRef.current, { pixelRatio: 2, backgroundColor: "#ffffff" });
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `visit-pass-${confirmation.reference}.png`;
      link.click();
    } catch {
      /* best-effort — no toast infra on this public page */
    } finally {
      setIsDownloading(false);
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeArt }}
      className="mx-auto mt-12 max-w-3xl"
    >
      <div
        ref={passRef}
        className="overflow-hidden rounded-3xl border border-[#c8a96e]/25 bg-white shadow-soft"
      >
        {/* Confirmation band */}
        <div className="flex flex-col items-center gap-3 border-b border-ink/5 bg-pigment-teal/[0.07] px-6 py-8 text-center sm:px-9">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pigment-teal/15 text-pigment-teal">
            <CheckCircle2 size={26} />
          </span>
          <h3 className="text-fluid-xl font-semibold text-ink">{t("confirmation.heading")}</h3>
          <p className="max-w-sm text-fluid-xs leading-relaxed text-ink-soft">{t("confirmation.subheading")}</p>
          <span className="mt-1 rounded-full bg-pigment-gold/15 px-3 py-1 text-fluid-xs font-medium text-[#8a6d1f]">
            {t("statusPage.status.pending")}
          </span>
        </div>

        {/* Header: museum lockup, accent rule, pass title */}
        <div className="px-6 pt-6 sm:px-9">
          <div className="flex items-start justify-between gap-4">
            <BrandLockup />
          </div>
          <div className="mt-4 h-[3px] w-full rounded-full bg-[#850B10]" />
          <div className="mt-5 pb-6">
            <h1 className="text-fluid-xl font-bold text-ink">{t("print.title")}</h1>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-ink-faint">
              Visit Pass
            </p>
          </div>
        </div>

        {/* 2-column body: avatar + QR on one side, details card on the other */}
        <div className="grid grid-cols-1 gap-6 border-t border-ink/5 bg-canvas-soft/50 px-6 py-7 sm:grid-cols-[210px_1fr] sm:px-9">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="flex h-16 w-16 items-center justify-center rounded-full bg-canvas-paper text-fluid-lg font-semibold text-ink-soft ring-1 ring-ink/10">
              {initials(confirmation.name)}
            </span>

            <div className="rounded-xl border border-ink/10 bg-white p-3 shadow-card">
              <BookingQr path={statusPath} size={160} />
            </div>

            <p className="max-w-[13rem] text-fluid-xs leading-relaxed text-ink-soft">
              {t("confirmation.qrHint")}
            </p>
            <a
              href={statusPath}
              className="inline-flex items-center gap-1.5 text-fluid-xs font-medium text-[#850B10] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#6a090d]"
            >
              <ExternalLink size={14} />
              {t("confirmation.viewStatus")}
            </a>
          </div>

          <dl className="rounded-2xl border border-ink/10 bg-white px-5">
            <Row label={t("confirmation.name")} value={confirmation.name} />
            <Row label={t("confirmation.phone")} value={confirmation.phone} ltr />
            <Row label={t("confirmation.guests")} value={confirmation.guests} />
            <Row label={t("confirmation.visitorType")} value={confirmation.visitorTypeLabel} />
            <Row
              label={t("confirmation.date")}
              value={
                <span className="flex flex-col items-end leading-tight">
                  <span>{confirmation.visitWeekday}</span>
                  <span className="text-fluid-xs font-normal text-ink-faint">{confirmation.visitDayMonth}</span>
                </span>
              }
            />
            <Row label={t("confirmation.time")} value={confirmation.timeLabel} />
            <Row
              label={t("confirmation.submittedAt")}
              value={
                <span className="flex flex-col items-end leading-tight">
                  <span>{submittedAt.time}</span>
                  <span className="text-fluid-xs font-normal text-ink-faint">{submittedAt.date}</span>
                </span>
              }
              ltr
            />
            {confirmation.note && (
              <Row label={t("confirmation.note")} value={<span className="whitespace-pre-wrap">{confirmation.note}</span>} />
            )}
          </dl>
        </div>

        {/* Guidelines */}
        <div className="border-t border-ink/5 px-6 py-6 sm:px-9">
          <p className="text-fluid-sm font-semibold text-ink">{t("print.guidelinesTitle")}</p>
          <ul className="mt-2.5 list-disc space-y-1 ps-5 text-fluid-xs leading-relaxed text-ink-soft">
            {guidelines.map((g) => (
              <li key={g}>{g}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Actions — outside passRef, so they never end up in the downloaded image */}
      <div className="mt-6 flex flex-wrap items-center justify-center gap-4 print:hidden">
        <button
          type="button"
          onClick={handleDownload}
          disabled={isDownloading}
          className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-5 py-2.5 text-fluid-xs font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95 disabled:pointer-events-none disabled:opacity-60"
        >
          {isDownloading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
          {t("confirmation.downloadImage")}
        </button>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-2 text-fluid-xs font-medium text-ink-soft transition-colors hover:text-ink"
        >
          <RotateCcw size={15} />
          {t("confirmation.again")}
        </button>
      </div>
    </motion.div>
  );
}
