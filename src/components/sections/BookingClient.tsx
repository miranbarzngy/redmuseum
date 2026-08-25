"use client";

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations, useLocale } from "next-intl";
import { Loader2, CheckCircle2, AlertCircle, Check, ChevronLeft, ChevronRight } from "lucide-react";
import clsx from "clsx";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { useDirection } from "@/lib/useDirection";
import { easeArt } from "@/lib/motionVariants";

// The camera touches `window`/getUserMedia, so it can only ever render on
// the client — dynamic + ssr:false keeps it out of the server bundle.
const PhotoCapture = dynamic(() => import("./PhotoCapture").then((m) => m.PhotoCapture), { ssr: false });

const TIME_SLOTS = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"];
const VISIBLE_DAYS = 21;
const STEP_COUNT = 4;

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

export function BookingClient() {
  const t = useTranslations("booking");
  const locale = useLocale();
  const dir = useDirection();

  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

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
    defaultValues: { name: "", phone: "", note: "" },
  });

  const days = useMemo(() => upcomingDays(VISIBLE_DAYS), []);
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "short", day: "numeric", month: "short" }),
    [locale]
  );

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
    reset({ name: "", phone: "", note: "" });
  }

  async function handleNextFromInfo() {
    const valid = await trigger(["name", "phone"]);
    if (valid) goTo(2);
  }

  async function handleSubmitBooking() {
    if (!visitDate || !visitTime) return;
    const valid = await trigger(["name", "phone"]);
    if (!valid) {
      goTo(1);
      return;
    }

    const values = getValues();
    setIsSubmitting(true);
    setStatus("idle");

    const timeLabel = t("timePrefix", { time: visitTime });
    const note = [timeLabel, values.note?.trim()].filter(Boolean).join("\n");

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: values.name,
          phone: values.phone,
          visitDate,
          note,
          faceImagePath,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      resetAll();
    } catch {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  }

  const stepLabels = [t("steps.photo"), t("steps.info"), t("steps.day"), t("steps.time")];

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

        <Reveal delay={0.1}>
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
                    <div className="flex flex-col items-center gap-1 text-center">
                      <h3 className="text-fluid-lg font-semibold text-ink">{t("photoStep.title")}</h3>
                      <p className="mb-6 max-w-sm text-fluid-xs text-ink-faint">{t("photoStep.subtitle")}</p>
                      <PhotoCapture
                        imageUrl={faceImageUrl}
                        onCaptured={({ url, path }) => {
                          setFaceImageUrl(url);
                          setFaceImagePath(path);
                          goTo(1);
                        }}
                        onReset={resetPhoto}
                        onSkip={() => goTo(1)}
                      />
                    </div>
                  )}

                  {step === 1 && (
                    <div className="flex flex-col gap-5">
                      <div className="flex flex-col gap-1.5">
                        <label htmlFor="name" className="text-fluid-xs font-medium text-ink-soft">
                          {t("form.name")}
                        </label>
                        <input
                          id="name"
                          required
                          autoFocus
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
                    </div>
                  )}

                  {step === 2 && (
                    <div className="flex flex-col gap-4">
                      <p className="text-fluid-xs font-medium text-ink-soft">{t("form.visitDate")}</p>
                      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-2">
                        {days.map((d) => {
                          const iso = isoDate(d);
                          const selected = visitDate === iso;
                          const parts = dayFormatter.formatToParts(d);
                          const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
                          const day = parts.find((p) => p.type === "day")?.value ?? "";
                          const month = parts.find((p) => p.type === "month")?.value ?? "";
                          return (
                            <button
                              key={iso}
                              type="button"
                              onClick={() => setVisitDate(iso)}
                              className={clsx(
                                "flex min-w-[4.5rem] shrink-0 flex-col items-center gap-1 rounded-2xl border px-3 py-3 text-center transition-all",
                                selected
                                  ? "border-[#850B10] bg-[#850B10] text-canvas shadow-card"
                                  : "border-ink/10 bg-canvas text-ink hover:border-[#c8a96e]/60"
                              )}
                            >
                              <span className={clsx("text-fluid-xs", selected ? "text-canvas/80" : "text-ink-faint")}>
                                {weekday}
                              </span>
                              <span className="text-fluid-lg font-semibold leading-none">{day}</span>
                              <span className={clsx("text-fluid-xs", selected ? "text-canvas/80" : "text-ink-faint")}>
                                {month}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {step === 3 && (
                    <div className="flex flex-col gap-6">
                      <div className="flex flex-col gap-3">
                        <p className="text-fluid-xs font-medium text-ink-soft">{t("form.visitTime")}</p>
                        <div className="grid grid-cols-4 gap-2">
                          {TIME_SLOTS.map((slot) => {
                            const selected = visitTime === slot;
                            return (
                              <button
                                key={slot}
                                type="button"
                                onClick={() => setVisitTime(slot)}
                                className={clsx(
                                  "rounded-xl border px-2 py-2.5 text-fluid-xs font-medium transition-all",
                                  selected
                                    ? "border-[#850B10] bg-[#850B10] text-canvas shadow-card"
                                    : "border-ink/10 bg-canvas text-ink hover:border-[#c8a96e]/60"
                                )}
                              >
                                {slot}
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
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer nav */}
            {step > 0 && (
              <div className="flex items-center justify-between gap-4 border-t border-ink/5 bg-canvas-soft/60 px-6 py-5 sm:px-9">
                <button
                  type="button"
                  onClick={() => goTo(step - 1)}
                  className="inline-flex items-center gap-1.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:text-ink"
                >
                  {dir === "rtl" ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                  {t("nav.back")}
                </button>

                {step === 1 && (
                  <button
                    type="button"
                    onClick={handleNextFromInfo}
                    className="inline-flex items-center gap-2 rounded-full bg-[#850B10] px-6 py-3 text-fluid-sm font-medium text-canvas shadow-card transition-transform hover:scale-[1.03] active:scale-95"
                  >
                    {t("nav.next")}
                    {dir === "rtl" ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => goTo(3)}
                    disabled={!visitDate}
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
            )}
          </div>

          <div className="mx-auto mt-4 flex max-w-xl justify-center">
            {status === "success" && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-fluid-xs text-pigment-teal"
              >
                <CheckCircle2 size={16} /> {t("form.success")}
              </motion.span>
            )}
            {status === "error" && (
              <motion.span
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 text-fluid-xs text-pigment-crimson"
              >
                <AlertCircle size={16} /> {t("form.error")}
              </motion.span>
            )}
          </div>
        </Reveal>
      </div>
    </section>
  );
}
