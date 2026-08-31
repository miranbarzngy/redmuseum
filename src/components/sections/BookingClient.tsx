"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useDirection } from "@/lib/useDirection";
import { easeArt } from "@/lib/motionVariants";
import { localizeDigits, holidayKeyFor } from "@/lib/kurdishCalendar";
import { BookingSuccess, type BookingConfirmation } from "./BookingSuccess";
import { BookingStatusLookup } from "./BookingStatusLookup";
import type { BookingSettings } from "@/lib/data/bookingSettings";

// The camera touches `window`/getUserMedia, so it can only ever render on
// the client — dynamic + ssr:false keeps it out of the server bundle.
const PhotoCapture = dynamic(() => import("./PhotoCapture").then((m) => m.PhotoCapture), { ssr: false });

// The bookable weekdays / time slots / how-far-ahead window come from
// booking_settings (0036), editable at /admin/bookings/schedule. The
// opening / staff-break / closing hours still show as a plain caption above
// the slot grid (booking.form.openingTimeValue etc.), independent of these.
const STEP_COUNT = 4;
const MAX_GUESTS = 200;
const VISITOR_TYPES = ["school", "delegation", "personal", "press", "other"] as const;

/** "13:00" -> { time: "1:00", period: "PM" } (digits and meridiem localized for ku/ar). */
function formatSlot(slot: string, locale: string, meridiem: { am: string; pm: string }): { time: string; period: string } {
  const hour = Number(slot.slice(0, 2));
  const period = hour < 12 ? meridiem.am : meridiem.pm;
  const hour12 = ((hour + 11) % 12) + 1;
  return { time: `${localizeDigits(hour12, locale)}:${localizeDigits(slot.slice(3), locale)}`, period };
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

function upcomingDays(count: number): Date[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() + i);
    return d;
  });
}

export function BookingClient({ settings }: { settings: BookingSettings }) {
  const t = useTranslations("booking");
  const locale = useLocale();
  const dir = useDirection();

  const [mode, setMode] = useState<"book" | "status">("book");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState<"idle" | "error">("idle");
  const [confirmation, setConfirmation] = useState<BookingConfirmation | null>(null);

  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(null);
  const [faceImagePath, setFaceImagePath] = useState<string | null>(null);

  const [visitDate, setVisitDate] = useState<string | null>(null);
  const [visitTime, setVisitTime] = useState<string | null>(null);

  const schema = z.object({
    name: z.string().min(1, t("form.errors.name")),
    phone: z
      .string()
      .min(7, t("form.errors.phone"))
      .regex(/^[0-9+\-\s()]+$/, t("form.errors.phone")),
    guestCount: z
      .string()
      .regex(/^\d+$/, t("form.errors.guestCount"))
      .refine((v) => Number(v) >= 1 && Number(v) <= MAX_GUESTS, t("form.errors.guestCount")),
    visitorType: z.enum(VISITOR_TYPES, { error: t("form.errors.visitorType") }),
    note: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    trigger,
    getValues,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", guestCount: "1", visitorType: undefined, note: "" },
  });

  const days = useMemo(
    () => upcomingDays(settings.bookingWindowDays).filter((d) => settings.openWeekdays.includes(d.getDay())),
    [settings.bookingWindowDays, settings.openWeekdays]
  );
  const weekdayNames = t.raw("weekdays") as string[];
  const meridiem = t.raw("meridiem") as { am: string; pm: string };

  const [isSubmitting, setIsSubmitting] = useState(false);

  function goTo(next: number) {
    setDirection(next > step ? 1 : -1);
    setStep(next);
  }

  function resetPhoto() {
    setFaceImageUrl(null);
    setFaceImagePath(null);
  }

  function resetAll() {
    resetPhoto();
    setVisitDate(null);
    setVisitTime(null);
    setStep(0);
    setDirection(1);
    reset({ name: "", phone: "", guestCount: "1", visitorType: undefined, note: "" });
  }

  async function handleNextFromInfo() {
    const valid = await trigger(["name", "phone", "guestCount", "visitorType"]);
    if (valid) goTo(1);
  }

  async function handleSubmitBooking() {
    if (!visitDate || !visitTime) return;
    const valid = await trigger(["name", "phone", "guestCount", "visitorType"]);
    if (!valid) {
      goTo(0);
      return;
    }

    const values = getValues();
    setIsSubmitting(true);
    setStatus("idle");

    const slot = formatSlot(visitTime, locale, meridiem);
    const timeLabel = t("timePrefix", { time: `${slot.time} ${slot.period}` });
    const userNote = values.note?.trim() ?? "";
    const note = [timeLabel, userNote].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          visitDate,
          guestCount: Number(values.guestCount),
          visitorType: values.visitorType,
          note,
          faceImagePath,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = (await res.json().catch(() => null)) as { ok?: boolean; token?: string } | null;
      if (!data?.ok || !data.token) throw new Error("Request failed");

      // visit_date is a plain SQL date — parse/format it in UTC so the day
      // matches what the admin panel shows (see formatBookingDate.ts).
      const d = new Date(`${visitDate}T00:00:00Z`);
      const dateLabel = `${weekdayNames[d.getUTCDay()] ?? ""} · ${localizeDigits(
        d.getUTCDate(),
        locale
      )} ${t("monthLabel", { month: localizeDigits(d.getUTCMonth() + 1, locale) })}`;

      setConfirmation({
        token: data.token,
        reference: data.token.slice(0, 8).toUpperCase(),
        name: values.name,
        phone: values.phone,
        guests: Number(values.guestCount),
        visitorTypeLabel: t(`form.visitorTypes.${values.visitorType}`),
        dateLabel,
        timeLabel: `${slot.time} ${slot.period}`,
        note: userNote,
      });
      resetAll();
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepLabels = [t("steps.info"), t("steps.day"), t("steps.time"), t("steps.photo")];

  // `direction` is +1 moving forward / -1 moving back. RTL layouts read
  // right-to-left, so "forward" should slide from the visually-opposite
  // side there too.
  const rtlSign = dir === "rtl" ? -1 : 1;
  const slideVariants = {
    enter: (d: number) => ({ opacity: 0, x: d * rtlSign * 48 }),
    center: { opacity: 1, x: 0 },
    exit: (d: number) => ({ opacity: 0, x: -d * rtlSign * 48 }),
  };

  return (
    <section id="booking" className="relative py-24 sm:py-32">
      <div className="container-art section-px">
        <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} subheading={t("subheading")} />

        {!confirmation && (
          <div className="mt-8 flex justify-center">
            <div className="inline-flex rounded-full border border-ink/15 bg-canvas-soft p-1">
              {(["book", "status"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMode(m)}
                  className="relative rounded-full px-4 py-2 text-fluid-xs font-medium sm:px-5"
                >
                  {mode === m && (
                    <motion.span
                      layoutId="bookingModePill"
                      transition={{ type: "spring", stiffness: 400, damping: 34 }}
                      className="absolute inset-0 rounded-full bg-[#850B10]"
                    />
                  )}
                  <span className={clsx("relative z-10", mode === m ? "text-canvas" : "text-ink-soft")}>
                    {t(m === "book" ? "toggle.book" : "toggle.status")}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <Reveal delay={0.1}>
          {confirmation ? (
            <BookingSuccess
              confirmation={confirmation}
              locale={locale}
              onReset={() => setConfirmation(null)}
            />
          ) : mode === "status" ? (
            <BookingStatusLookup />
          ) : (
            <>
          <div className="mx-auto mt-12 max-w-xl overflow-hidden rounded-3xl border border-[#c8a96e]/25 bg-white shadow-soft">
            {/* Step indicator */}
            <div className="border-b border-ink/5 bg-canvas-soft/60 px-6 pb-5 pt-7 sm:px-9">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-4 h-[2px] bg-ink/10" />
                <motion.div
                  className="absolute top-4 h-[2px] bg-[#850B10]"
                  style={dir === "rtl" ? { right: 0 } : { left: 0 }}
                  animate={{ width: `${(step / (STEP_COUNT - 1)) * 100}%` }}
                  transition={{ duration: 0.5, ease: easeArt }}
                />
                {stepLabels.map((label, i) => {
                  const complete = i < step;
                  const active = i === step;
                  return (
                    <div key={label} className="relative z-10 flex flex-col items-center gap-2">
                      <motion.div
                        animate={{
                          scale: active ? 1.12 : 1,
                          backgroundColor: complete || active ? "#850B10" : "#FAFAF7",
                          borderColor: complete || active ? "#850B10" : "rgba(28,27,25,0.15)",
                        }}
                        transition={{ duration: 0.35, ease: easeArt }}
                        className="flex h-8 w-8 items-center justify-center rounded-full border-2 text-fluid-xs font-semibold"
                      >
                        {complete ? (
                          <Check size={14} className="text-canvas" strokeWidth={3} />
                        ) : (
                          <span className={active ? "text-canvas" : "text-ink-faint"}>{i + 1}</span>
                        )}
                      </motion.div>
                      <span
                        className={clsx(
                          "hidden text-fluid-xs font-medium transition-colors sm:block",
                          active ? "text-ink" : "text-ink-faint"
                        )}
                      >
                        {label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step content */}
            <div className="relative overflow-hidden px-6 py-9 sm:px-9">
              <AnimatePresence mode="wait" custom={direction} initial={false}>
                <motion.div
                  key={step}
                  custom={direction}
                  variants={slideVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.4, ease: easeArt }}
                >
                  {step === 0 && (
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="name" className="text-fluid-xs font-medium text-ink-soft">
                          {t("form.name")}
                        </label>
                        <input
                          id="name"
                          required
                          {...register("name")}
                          placeholder={t("form.namePlaceholder")}
                          className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-[#850B10]"
                        />
                        {errors.name && <span className="text-fluid-xs text-pigment-crimson">{errors.name.message}</span>}
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="phone" className="text-fluid-xs font-medium text-ink-soft">
                          {t("form.phone")}
                        </label>
                        <input
                          id="phone"
                          type="tel"
                          required
                          {...register("phone")}
                          placeholder={t("form.phonePlaceholder")}
                          className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-[#850B10]"
                        />
                        {errors.phone && <span className="text-fluid-xs text-pigment-crimson">{errors.phone.message}</span>}
                      </div>
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="guestCount" className="text-fluid-xs font-medium text-ink-soft">
                            {t("form.guestCount")}
                          </label>
                          <input
                            id="guestCount"
                            type="number"
                            inputMode="numeric"
                            min={1}
                            max={MAX_GUESTS}
                            required
                            {...register("guestCount")}
                            className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-[#850B10]"
                          />
                          {errors.guestCount && (
                            <span className="text-fluid-xs text-pigment-crimson">{errors.guestCount.message}</span>
                          )}
                        </div>
                        <div className="flex flex-col gap-1.5">
                          <label htmlFor="visitorType" className="text-fluid-xs font-medium text-ink-soft">
                            {t("form.visitorType")}
                          </label>
                          <select
                            id="visitorType"
                            required
                            defaultValue=""
                            {...register("visitorType")}
                            className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-[#850B10]"
                          >
                            <option value="" disabled>
                              {t("form.visitorTypePlaceholder")}
                            </option>
                            {VISITOR_TYPES.map((key) => (
                              <option key={key} value={key}>
                                {t(`form.visitorTypes.${key}`)}
                              </option>
                            ))}
                          </select>
                          {errors.visitorType && (
                            <span className="text-fluid-xs text-pigment-crimson">{errors.visitorType.message}</span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {step === 1 && (
                    <div className="flex flex-col gap-4">
                      <p className="text-fluid-xs font-medium text-ink-soft">{t("form.visitDate")}</p>
                      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                        {days.map((d) => {
                          const iso = isoDate(d);
                          const selected = visitDate === iso;
                          const weekday = weekdayNames[d.getDay()] ?? "";
                          const day = localizeDigits(d.getDate(), locale);
                          const month = t("monthLabel", { month: localizeDigits(d.getMonth() + 1, locale) });
                          const holidayKey = holidayKeyFor(d);
                          const holidayName = holidayKey ? t(`holidays.${holidayKey}`) : null;
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => setVisitDate(iso)}
                              title={holidayName ?? undefined}
                              className={clsx(
                                "relative flex min-w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center transition-all",
                                selected
                                  ? "border-[#850B10] bg-[#850B10] text-canvas shadow-card"
                                  : holidayName
                                    ? "border-[#c8a96e] bg-[#c8a96e]/10 text-ink hover:border-[#c8a96e]"
                                    : "border-ink/10 bg-canvas text-ink hover:border-[#c8a96e]/60"
                              )}
                            >
                              {holidayName && !selected && (
                                <span className="absolute end-2 top-2 h-1.5 w-1.5 rounded-full bg-[#c8a96e]" />
                              )}
                              <span className={clsx("text-fluid-xs", selected ? "text-canvas/80" : "text-ink-faint")}>
                                {weekday}
                              </span>
                              <span className="text-fluid-lg font-semibold leading-none">{day}</span>
                              <span className={clsx("text-fluid-xs", selected ? "text-canvas/80" : "text-ink-faint")}>
                                {month}
                              </span>
                              {holidayName && (
                                <span
                                  className={clsx(
                                    "mt-0.5 text-[10px] font-medium leading-tight",
                                    selected ? "text-canvas" : "text-[#850B10]"
                                  )}
                                >
                                  {holidayName}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <p className="text-fluid-xs font-medium text-ink-soft">{t("form.visitTime")}</p>

                        {/* Opening hours as a quiet caption — informs without competing with the choices below. */}
                        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 rounded-lg bg-canvas-paper/50 px-3 py-2 text-[11px] text-ink-faint">
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-pigment-teal" />
                            {t("form.openingTime")} {t("form.openingTimeValue")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#c8a96e]" />
                            {t("form.staffBreak")} {t("form.staffBreakValue")}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-[#850B10]" />
                            {t("form.closingTime")} {t("form.closingTimeValue")}
                          </span>
                        </div>

                        {/* The actual choices — promoted with a resting shadow and a hover lift. */}
                        <div className="grid grid-cols-3 gap-2">
                          {settings.timeSlots.map((slot) => {
                            const selected = visitTime === slot;
                            const { time, period } = formatSlot(slot, locale, meridiem);
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setVisitTime(slot)}
                                className={clsx(
                                  "flex flex-col items-center gap-0.5 rounded-xl border px-2 py-3 transition-all",
                                  selected
                                    ? "border-[#850B10] bg-[#850B10] text-canvas shadow-card"
                                    : "border-ink/15 bg-canvas text-ink shadow-sm hover:-translate-y-0.5 hover:border-[#850B10] hover:shadow-card"
                                )}
                              >
                                <span className="text-fluid-lg font-semibold leading-none">{time}</span>
                                <span
                                  className={clsx(
                                    "text-[10px] leading-tight",
                                    selected ? "text-canvas/75" : "text-ink-faint"
                                  )}
                                >
                                  {period}
                                </span>
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="note" className="text-fluid-xs font-medium text-ink-soft">
                          {t("form.note")}
                        </label>
                        <textarea
                          id="note"
                          rows={3}
                          {...register("note")}
                          placeholder={t("form.notePlaceholder")}
                          className="resize-none rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-[#850B10]"
                        />
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col items-center gap-1 text-center">
                      <h3 className="mb-6 text-fluid-lg font-semibold text-ink">{t("photoStep.title")}</h3>
                      <PhotoCapture
                        imageUrl={faceImageUrl}
                        onCaptured={({ url, path }) => {
                          setFaceImageUrl(url);
                          setFaceImagePath(path);
                        }}
                        onReset={resetPhoto}
                      />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            <div className="flex items-center justify-between gap-4 border-t border-ink/5 bg-canvas-soft/60 px-6 py-5 sm:px-9">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className="inline-flex items-center gap-1.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  {dir === "rtl" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  {t("nav.back")}
                </button>
              ) : (
                <span />
              )}

              {step === 0 && (
                <button
                  type="button"
                  onClick={handleNextFromInfo}
                  className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95"
                >
                  {t("nav.next")}
                  {dir === "rtl" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              )}

              {step === 1 && (
                <button
                  type="button"
                  onClick={() => goTo(2)}
                  disabled={!visitDate}
                  className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                >
                  {t("nav.next")}
                  {dir === "rtl" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              )}

              {step === 2 && (
                <button
                  type="button"
                  onClick={() => goTo(3)}
                  disabled={!visitTime}
                  className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                >
                  {t("nav.next")}
                  {dir === "rtl" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                </button>
              )}

              {step === 3 && (
                <button
                  type="button"
                  onClick={handleSubmitBooking}
                  disabled={isSubmitting || !visitTime}
                  className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95 disabled:pointer-events-none disabled:opacity-40"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> {t("form.sending")}
                    </>
                  ) : (
                    t("form.submit")
                  )}
                </button>
              )}
            </div>
          </div>

          {status === "error" && (
            <div className="mx-auto mt-4 flex max-w-xl justify-center">
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-fluid-xs text-pigment-crimson"
              >
                <AlertCircle size={16} /> {t("form.error")}
              </motion.span>
            </div>
          )}
            </>
          )}
        </Reveal>
      </div>
    </section>
  );
}
