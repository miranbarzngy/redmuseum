"use client";

import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { CheckCircle2, ExternalLink, RotateCcw } from "lucide-react";
import { easeArt } from "@/lib/motionVariants";
import { BookingQr } from "@/components/BookingQr";
import { BrandLockup } from "@/components/BrandLockup";

export interface BookingConfirmation {
  token: string;
  reference: string;
  name: string;
  phone: string;
  guests: number;
  visitorTypeLabel: string;
  dateLabel: string;
  timeLabel: string;
  note: string;
}

function Row({ label, value, ltr = false }: { label: string; value: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-ink/5 py-2.5 last:border-0">
      <dt className="shrink-0 text-fluid-xs font-medium text-ink-faint">{label}</dt>
      <dd className="text-end text-fluid-sm text-ink" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: easeArt }}
      className="mx-auto mt-12 max-w-xl overflow-hidden rounded-3xl border border-[#c8a96e]/25 bg-white shadow-soft"
    >
      <BrandLockup className="border-b border-ink/5 px-6 py-4" />

      {/* Confirmation band */}
      <div className="flex flex-col items-center gap-3 border-b border-ink/5 bg-pigment-teal/[0.07] px-6 py-8 text-center sm:px-9">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-pigment-teal/15 text-pigment-teal">
          <CheckCircle2 size={26} />
        </span>
        <h3 className="text-fluid-xl font-semibold text-ink">{t("confirmation.heading")}</h3>
        <p className="max-w-sm text-fluid-xs leading-relaxed text-ink-soft">
          {t("confirmation.subheading")}
        </p>
        <span className="mt-1 rounded-full bg-pigment-gold/15 px-3 py-1 text-fluid-xs font-medium text-[#8a6d1f]">
          {t("statusPage.status.pending")}
        </span>
      </div>

      {/* Details */}
      <dl className="px-6 py-5 sm:px-9">
        <Row label={t("confirmation.reference")} value={<span dir="ltr">{confirmation.reference}</span>} ltr />
        <Row label={t("confirmation.name")} value={confirmation.name} />
        <Row label={t("confirmation.phone")} value={confirmation.phone} ltr />
        <Row label={t("confirmation.guests")} value={confirmation.guests} />
        <Row label={t("confirmation.visitorType")} value={confirmation.visitorTypeLabel} />
        <Row label={t("confirmation.date")} value={confirmation.dateLabel} />
        <Row label={t("confirmation.time")} value={confirmation.timeLabel} />
        {confirmation.note && (
          <Row label={t("confirmation.note")} value={<span className="whitespace-pre-wrap">{confirmation.note}</span>} />
        )}
      </dl>

      {/* QR pass */}
      <div className="flex flex-col items-center gap-3 border-t border-ink/5 bg-canvas-soft/50 px-6 py-7 text-center sm:px-9">
        <BookingQr path={statusPath} />
        <p className="max-w-xs text-fluid-xs leading-relaxed text-ink-soft">{t("confirmation.qrHint")}</p>
        <a
          href={statusPath}
          className="inline-flex items-center gap-1.5 text-fluid-xs font-medium text-[#850B10] underline decoration-dotted underline-offset-4 transition-colors hover:text-[#6a090d]"
        >
          <ExternalLink size={14} />
          {t("confirmation.viewStatus")}
        </a>
      </div>

      {/* Actions */}
      <div className="flex justify-center border-t border-ink/5 px-6 py-5 sm:px-9">
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
