"use client";

import { useState } from "react";
import Image from "next/image";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Mail, MapPin, Loader2, CheckCircle2, AlertCircle, ChevronDown } from "lucide-react";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { socials } from "@/data/socials";
import type { SiteProfileRow } from "@/lib/supabase/database.types";

const TYPE_KEYS = ["commission", "media", "other"] as const;

export function ContactClient({ profile }: { profile: SiteProfileRow | null }) {
  const t = useTranslations("contact");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const contactCardImageUrl = profile?.contact_card_image_url ?? null;

  const schema = z.object({
    name: z.string().min(1, t("form.errors.name")),
    phone: z
      .string()
      .min(7, t("form.errors.phone"))
      .regex(/^[0-9+\-\s()]+$/, t("form.errors.phone")),
    type: z.enum(TYPE_KEYS),
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
    defaultValues: { type: "commission" },
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
      reset({ name: "", phone: "", type: "commission", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <section id="contact" className="relative py-24 sm:py-32">
      <div className="container-art section-px grid gap-16 sm:gap-14 lg:grid-cols-[3fr_2fr] lg:gap-20">
        <div className="flex flex-col gap-10">
          <SectionHeading eyebrow={t("eyebrow")} heading={t("heading")} subheading={t("subheading")} />

          <Reveal delay={0.1}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-5 rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8"
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
                    className="rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
                  />
                  {errors.phone && (
                    <span className="text-fluid-xs text-pigment-crimson">{errors.phone.message}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="type" className="text-fluid-xs font-medium text-ink-soft">
                  {t("form.type")}
                </label>
                <div className="relative">
                  <select
                    id="type"
                    required
                    {...register("type")}
                    className="w-full appearance-none rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
                  >
                    {TYPE_KEYS.map((key) => (
                      <option key={key} value={key}>
                        {t(`form.typeOptions.${key}`)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute end-4 top-1/2 -translate-y-1/2 text-ink-faint"
                  />
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
                  className="resize-none rounded-xl border border-ink/15 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
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

        <Reveal from="end" delay={0.15}>
          {contactCardImageUrl ? (
            <div className="relative hidden h-full min-h-[420px] w-full overflow-hidden rounded-2xl lg:block">
              <Image
                src={contactCardImageUrl}
                alt=""
                fill
                sizes="(min-width: 1024px) 40vw, 100vw"
                className="object-cover"
              />
            </div>
          ) : (
            <div className="flex h-full flex-col justify-between gap-10 rounded-2xl bg-ink p-8 text-canvas sm:p-10">
              <div className="flex flex-col gap-6">
                <h3 className="font-display text-fluid-lg font-semibold">{t("info.heading")}</h3>
                <div className="flex flex-col gap-4 text-fluid-sm text-canvas/85">
                  <div className="flex items-start gap-3">
                    <Mail size={18} className="mt-0.5 shrink-0 text-pigment-gold" />
                    <div>
                      <div className="text-fluid-xs uppercase tracking-[0.2em] text-canvas/60">
                        {t("info.emailLabel")}
                      </div>
                      {/* TODO: replace with the museum's real contact email */}
                      <a href="mailto:info@amnasuraka.museum" className="hover:text-pigment-gold">
                        info@amnasuraka.museum
                      </a>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin size={18} className="mt-0.5 shrink-0 text-pigment-gold" />
                    <div>
                      <div className="text-fluid-xs uppercase tracking-[0.2em] text-canvas/60">
                        {t("info.studioLabel")}
                      </div>
                      <span>{t("info.studioValue")}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <span className="text-fluid-xs uppercase tracking-[0.2em] text-canvas/60">
                  {t("info.socialsHeading")}
                </span>
                <div className="flex items-center gap-3">
                  {socials.map((s) => (
                    <a
                      key={s.type}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={s.label}
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-canvas/20 text-canvas/85 transition-colors hover:border-pigment-gold hover:text-pigment-gold"
                    >
                      <SocialIcon type={s.type} className="h-4 w-4" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Reveal>
      </div>
    </section>
  );
}
