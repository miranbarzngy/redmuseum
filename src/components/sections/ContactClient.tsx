"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";

export function ContactClient() {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const schema = z.object({
    name: z.string().min(1, t("form.errors.name")),
    phone: z
      .string()
      .min(7, t("form.errors.phone"))
      .regex(/^[0-9+\-\s()]+$/, t("form.errors.phone")),
    message: z.string().min(10, t("form.errors.message")),
  });
  type FormValues = z.infer<typeof schema>;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  async function onSubmit(values: FormValues) {
    setStatus("idle");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) throw new Error("Request failed");
      setStatus("success");
      reset({ name: "", phone: "", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="container-art section-px flex flex-col gap-10">
        <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} subheading={t("subheading")} />

        <div className="mx-auto w-full max-w-2xl">
          <Reveal delay={0.1}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex h-full flex-col justify-between gap-5 rounded-2xl border-4 border-ink/15 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(28,27,25,0.35)] sm:p-8"
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
                    className="rounded-xl border border-ink/30 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
                  />
                  {errors.name && (
                    <span className="text-fluid-xs text-pigment-crimson">{errors.name.message}</span>
                  )}
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
                    className="rounded-xl border border-ink/30 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
                  />
                  {errors.phone && (
                    <span className="text-fluid-xs text-pigment-crimson">{errors.phone.message}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="message" className="text-fluid-xs font-medium text-ink-soft">
                  {t("form.message")}
                </label>
                <textarea
                  id="message"
                  rows={5}
                  required
                  {...register("message")}
                  placeholder={t("form.messagePlaceholder")}
                  className="resize-y rounded-xl border border-ink/30 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
                />
                {errors.message && (
                  <span className="text-fluid-xs text-pigment-crimson">{errors.message.message}</span>
                )}
              </div>

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
      </div>
    </section>
  );
}
