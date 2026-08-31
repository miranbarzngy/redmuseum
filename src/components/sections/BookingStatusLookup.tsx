"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Search, Loader2, AlertCircle, CalendarCheck } from "lucide-react";
import clsx from "clsx";
import { easeArt } from "@/lib/motionVariants";
import { localizeDigits } from "@/lib/kurdishCalendar";
import type { BookingStatus } from "@/lib/supabase/database.types";

interface LookupBooking {
  reference: string;
  visitDate: string;
  status: BookingStatus;
  guestCount: number;
}

const STATUS_PILL: Record<BookingStatus, string> = {
  pending: "bg-pigment-gold/15 text-[#8a6d1f]",
  confirmed: "bg-pigment-teal/15 text-pigment-teal",
  checked_in: "bg-ink/10 text-ink",
  cancelled: "bg-pigment-crimson/12 text-pigment-crimson",
  no_show: "bg-ink/5 text-ink-faint",
};

export function BookingStatusLookup() {
  const t = useTranslations("booking");
  const locale = useLocale();

  const [phone, setPhone] = useState("");
  const [state, setState] = useState<"idle" | "loading" | "done" | "error">("idle");
  const [errorKey, setErrorKey] = useState<"rateLimited" | "generic">("generic");
  const [results, setResults] = useState<LookupBooking[]>([]);

  const weekdays = t.raw("weekdays") as string[];

  function dateLabel(iso: string): string {
    const d = new Date(`${iso}T00:00:00Z`);
    return `${weekdays[d.getUTCDay()] ?? ""} · ${localizeDigits(d.getUTCDate(), locale)} ${t("monthLabel", {
      month: localizeDigits(d.getUTCMonth() + 1, locale),
    })}`;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (phone.replace(/\D/g, "").length < 7 || state === "loading") return;

    setState("loading");
    try {
      const res = await fetch("/api/booking/lookup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      if (res.status === 429) {
        setErrorKey("rateLimited");
        setState("error");
        return;
      }
      const data = (await res.json().catch(() => null)) as
        | { ok?: boolean; bookings?: LookupBooking[] }
        | null;
      if (!res.ok || !data?.ok || !Array.isArray(data.bookings)) {
        setErrorKey("generic");
        setState("error");
        return;
      }
      setResults(data.bookings);
      setState("done");
    } catch {
      setErrorKey("generic");
      setState("error");
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: easeArt }}
      className="mx-auto mt-10 max-w-xl rounded-3xl border border-[#c8a96e]/25 bg-white p-6 shadow-soft sm:p-8"
    >
      <h3 className="text-fluid-lg font-semibold text-ink">{t("lookup.heading")}</h3>
      <p className="mt-1.5 text-fluid-xs leading-relaxed text-ink-soft">{t("lookup.subheading")}</p>

      <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-2 sm:flex-row">
        <input
          type="tel"
          inputMode="tel"
          dir="ltr"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            if (state !== "idle" && state !== "loading") setState("idle");
          }}
          placeholder={t("form.phonePlaceholder")}
          className="flex-1 rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-[#850B10]"
        />
        <button
          type="submit"
          disabled={state === "loading" || phone.replace(/\D/g, "").length < 7}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.02] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
        >
          {state === "loading" ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
          {t("lookup.submit")}
        </button>
      </form>

      <AnimatePresence mode="wait">
        {state === "error" && (
          <motion.p
            key="error"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 flex items-center gap-1.5 text-fluid-xs text-pigment-crimson"
          >
            <AlertCircle size={14} />
            {t(errorKey === "rateLimited" ? "lookup.rateLimited" : "lookup.error")}
          </motion.p>
        )}

        {state === "done" && results.length === 0 && (
          <motion.p
            key="empty"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 text-fluid-xs text-ink-soft"
          >
            {t("lookup.empty")}
          </motion.p>
        )}

        {state === "done" && results.length > 0 && (
          <motion.ul
            key="results"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3, ease: easeArt }}
            className="mt-5 flex flex-col gap-2"
          >
            {results.map((b) => (
              <li
                key={b.reference + b.visitDate}
                className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 rounded-xl border border-ink/10 bg-canvas-soft/50 px-4 py-3"
              >
                <span className="flex items-center gap-2 text-fluid-sm text-ink">
                  <CalendarCheck size={15} className="shrink-0 text-ink-faint" />
                  {dateLabel(b.visitDate)}
                  <span className="text-ink-faint">· {localizeDigits(b.guestCount, locale)}</span>
                </span>
                <span
                  className={clsx("rounded-full px-2.5 py-1 text-fluid-xs font-medium", STATUS_PILL[b.status])}
                >
                  {t(`statusPage.status.${b.status}`)}
                </span>
                <p className="w-full text-fluid-xs text-ink-soft">{t(`statusPage.statusHint.${b.status}`)}</p>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
