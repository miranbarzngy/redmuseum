"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

// face-api.js needs `window`/camera access, so the capture step can only
// ever render on the client — dynamic + ssr:false keeps it out of the
// server-rendered bundle entirely.
const FaceCapture = dynamic(() => import("./FaceCapture").then((m) => m.FaceCapture), { ssr: false });

function todayIso(): string {
  return new Date().toISOString().split("T")[0];
}

export function BookingClient({ faceScanEnabled }: { faceScanEnabled: boolean }) {
  const t = useTranslations("booking");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [faceDescriptor, setFaceDescriptor] = useState<number[] | null>(null);

  const schema = z.object({
    name: z.string().min(1, t("form.errors.name")),
    phone: z
      .string()
      .min(7, t("form.errors.phone"))
      .regex(/^[0-9+\-\s()]+$/, t("form.errors.phone")),
    visitDate: z.string().min(1, t("form.errors.visitDate")),
    note: z.string().optional(),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: "", phone: "", visitDate: "", note: "" },
  });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...values,
          faceVectorData: faceScanEnabled ? faceDescriptor : null,
          faceScanConsent: faceScanEnabled && faceDescriptor !== null,
        }),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      setFaceDescriptor(null);
      reset({ name: "", phone: "", visitDate: "", note: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="booking" className="relative py-24 sm:py-32">
      <div className="container-art section-px">
        <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} subheading={t("subheading")} />

        <Reveal delay={0.1}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            className="mx-auto mt-12 flex max-w-xl flex-col gap-5 rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8"
          >
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="flex flex-col gap-1.5">
                <label htmlFor="name" className="text-fluid-xs font-medium text-ink-soft">
                  {t("form.name")}
                </label>
                <input
                  id="name"
                  required
                  {...register("name")}
                  placeholder={t("form.namePlaceholder")}
                  className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
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
                  className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
                />
                {errors.phone && <span className="text-fluid-xs text-pigment-crimson">{errors.phone.message}</span>}
              </div>
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="visitDate" className="text-fluid-xs font-medium text-ink-soft">
                {t("form.visitDate")}
              </label>
              <input
                id="visitDate"
                type="date"
                required
                min={todayIso()}
                {...register("visitDate")}
                className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
              />
              {errors.visitDate && (
                <span className="text-fluid-xs text-pigment-crimson">{errors.visitDate.message}</span>
              )}
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
                className="resize-none rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
              />
            </div>

            {faceScanEnabled && <FaceCapture onCapture={setFaceDescriptor} />}

            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> {t("form.sending")}
                  </>
                ) : (
                  t("form.submit")
                )}
              </Button>

              {status === "success" && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-fluid-xs text-pigment-teal"
                >
                  <CheckCircle2 size={16} /> {t("form.success")}
                </motion.span>
              )}
              {status === "error" && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-center gap-2 text-fluid-xs text-pigment-crimson"
                >
                  <AlertCircle size={16} /> {t("form.error")}
                </motion.span>
              )}
            </div>
          </form>
        </Reveal>
      </div>
    </section>
  );
}
