"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { motion } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import {
  Mail,
  MapPin,
  Phone,
  Clock,
  ChevronDown,
  Navigation,
  Loader2,
  Send,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { Link } from "@/i18n/navigation";
import { Reveal } from "@/components/ui/Reveal";
import { Button } from "@/components/ui/Button";
import { SocialIcon } from "@/components/ui/SocialIcon";
import { InfoCard } from "@/components/ui/InfoCard";
import { GuideFlyerCard } from "./GuideFlyerCard";
import { scrollToId } from "@/lib/scrollTo";
import { formatVisitingHours } from "@/lib/visitingHours";
import { CONTACT_SUBJECTS, type ContactSubject } from "@/lib/contactSubjects";
import type { Locale } from "@/i18n/routing";
import type { SocialLink } from "@/data/socials";

const FALLBACK_MAP_QUERY = "National Museum Amna Suraka, Sulaymaniyah, Iraq";
const MAP_SECTION_ID = "contact-map";

export interface ContactPageClientProps {
  email: string;
  phone: string;
  mapUrl: string | null;
  locationKu: string;
  locationEn: string;
  locationAr: string;
  socials: SocialLink[];
  /** JS Date.getDay() numbers, 0 = Sunday … 6 = Saturday (booking_settings). */
  openWeekdays: number[];
  /** Bookable start times, "HH:MM", sorted or not. */
  timeSlots: string[];
  guideFlyerUrl: string | null;
}

export function ContactPageClient({
  email,
  phone,
  mapUrl,
  locationKu,
  locationEn,
  locationAr,
  socials,
  openWeekdays,
  timeSlots,
  guideFlyerUrl,
}: ContactPageClientProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("contact");
  const tPage = useTranslations("contactPage");
  const tFooter = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tBooking = useTranslations("booking");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const location = locale === "en" ? locationEn : locale === "ar" ? locationAr : locationKu;

  const weekdayLabels = tBooking.raw("weekdays") as string[];
  const meridiem = tBooking.raw("meridiem") as { am: string; pm: string };
  const { daysText, hoursText } = formatVisitingHours({
    openWeekdays,
    timeSlots,
    locale,
    weekdayLabels,
    meridiem,
    closedLabel: tFooter("hoursClosed"),
  });

  const directionsUrl =
    mapUrl || `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(FALLBACK_MAP_QUERY)}`;
  const embedSrc = `https://www.google.com/maps?q=${encodeURIComponent(location || FALLBACK_MAP_QUERY)}&output=embed`;

  const schema = z.object({
    name: z.string().min(1, t("form.errors.name")),
    phone: z
      .string()
      .min(7, t("form.errors.phone"))
      .regex(/^[0-9+\-\s()]+$/, t("form.errors.phone")),
    subject: z.enum(CONTACT_SUBJECTS),
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
    defaultValues: { subject: "general" },
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
      reset({ name: "", phone: "", subject: "general", message: "" });
    } catch {
      setStatus("error");
    }
  }

  return (
    <div className="relative pb-24 pt-20 sm:pb-28 sm:pt-32">
      <div className="container-art section-px flex flex-col gap-14">
        <div className="flex flex-col gap-4">
          {/* Breadcrumbs */}
          <nav aria-label="breadcrumb" className="flex items-center gap-2 text-fluid-xs text-ink-faint">
            <Link href="/" className="transition-colors hover:text-[#850B10]">
              {tPage("breadcrumbHome")}
            </Link>
            <span>/</span>
            <span className="font-medium text-ink">{tNav("contact")}</span>
          </nav>

          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-4">
              <span className="h-px w-12 bg-[#850B10] sm:w-24" />
              <h1 className="font-display text-fluid-xl font-semibold text-ink">{tPage("heading")}</h1>
              <span className="h-px w-12 bg-[#850B10] sm:w-24" />
            </div>
            <p className="max-w-2xl text-center text-fluid-base leading-relaxed text-ink-soft">
              {tPage("subheading")}
            </p>
          </div>
        </div>

        {/* 2-column: info cards (right in RTL, first in DOM) / form (left, second) */}
        <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] lg:gap-14">
          <Reveal from="start" delay={0.05}>
            <div className="flex h-full flex-col gap-5">
              <h3 className="text-fluid-xs font-semibold uppercase tracking-[0.15em] text-ink-faint">
                {tPage("infoHeading")}
              </h3>

              {phone && (
                <InfoCard icon={<Phone size={18} />} label={tFooter("phoneLabel")}>
                  <a href={`tel:${phone}`} dir="ltr" className="hover:text-[#850B10]">
                    {phone}
                  </a>
                </InfoCard>
              )}

              <InfoCard icon={<Mail size={18} />} label={t("info.emailLabel")}>
                <a href={`mailto:${email}`} dir="ltr" className="hover:text-[#850B10]">
                  {email}
                </a>
              </InfoCard>

              <InfoCard icon={<MapPin size={18} />} label={t("info.studioLabel")}>
                <button
                  type="button"
                  onClick={() => scrollToId(MAP_SECTION_ID)}
                  className="block text-start hover:text-[#850B10]"
                >
                  {location}
                </button>
                <a
                  href={directionsUrl}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="mt-1 flex items-center gap-1 text-fluid-xs font-normal text-[#850B10]"
                >
                  <Navigation size={12} />
                  {tPage("getDirections")}
                </a>
              </InfoCard>

              <InfoCard icon={<Clock size={18} />} label={tFooter("hoursHeading")}>
                <span>{daysText}</span>
                <span className="block font-normal text-ink-soft">{hoursText}</span>
              </InfoCard>

              {(socials.length > 0 || mapUrl) && (
                <div className="flex items-center gap-3 pt-1">
                  {socials.map((s) => (
                    <a
                      key={s.type}
                      href={s.href}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label={s.label}
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-[#850B10] hover:text-[#850B10]"
                    >
                      <SocialIcon type={s.type} className="h-5 w-5" />
                    </a>
                  ))}
                  {mapUrl && (
                    <a
                      href={mapUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      aria-label="Google Maps"
                      className="flex h-11 w-11 items-center justify-center rounded-full border border-ink/15 text-ink-soft transition-colors hover:border-[#850B10] hover:text-[#850B10]"
                    >
                      <MapPin size={18} />
                    </a>
                  )}
                </div>
              )}

              <GuideFlyerCard href={guideFlyerUrl} className="mt-2" />
            </div>
          </Reveal>

          <Reveal from="end" delay={0.1}>
            <form
              onSubmit={handleSubmit(onSubmit)}
              noValidate
              className="flex flex-col gap-5 rounded-3xl border-4 border-ink/15 bg-white p-6 shadow-[0_20px_45px_-28px_rgba(28,27,25,0.35)] sm:p-8"
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
                    dir="ltr"
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
                <label htmlFor="subject" className="text-fluid-xs font-medium text-ink-soft">
                  {t("form.subjectLabel")}
                </label>
                <div className="relative">
                  <select
                    id="subject"
                    required
                    {...register("subject")}
                    className="w-full appearance-none rounded-xl border border-ink/30 bg-canvas px-4 py-3 text-fluid-sm text-ink outline-none transition-colors focus:border-pigment-terracotta"
                  >
                    {CONTACT_SUBJECTS.map((option: ContactSubject) => (
                      <option key={option} value={option}>
                        {t(`form.subjectOptions.${option}`)}
                      </option>
                    ))}
                  </select>
                  <ChevronDown
                    size={16}
                    className="pointer-events-none absolute inset-y-0 end-4 my-auto text-ink-faint"
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
                    <>
                      <Send size={15} /> {t("form.submit")}
                    </>
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

        {/* Embedded map */}
        <div id={MAP_SECTION_ID} className="flex flex-col gap-5 scroll-mt-28">
          <h3 className="text-fluid-lg font-semibold text-ink">{tPage("mapHeading")}</h3>
          <div className="relative h-80 w-full overflow-hidden rounded-3xl border border-ink/10 shadow-card sm:h-96">
            <iframe
              title={tPage("mapHeading")}
              src={embedSrc}
              className="h-full w-full border-0"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer noopener"
              className="absolute bottom-4 start-4 inline-flex items-center gap-2 rounded-full bg-white px-5 py-3 text-fluid-sm font-medium text-ink shadow-soft transition-transform hover:scale-[1.03]"
            >
              <Navigation size={16} className="text-[#850B10]" />
              {tPage("getDirections")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
