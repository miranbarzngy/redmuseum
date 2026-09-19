"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { scrollToId } from "@/lib/scrollTo";
import { formatVisitingHours } from "@/lib/visitingHours";
import { SocialIcon } from "@/components/ui/SocialIcon";
import type { Locale } from "@/i18n/routing";
import type { SocialLink } from "@/data/socials";

const FALLBACK_NAME_KU = "مۆزەخانەی نیشتیمانی ئەمنە سورەکە";
const FALLBACK_NAME_EN = "National Museum Amnasuraka";
const FALLBACK_NAME_AR = "متحف أمنة سوركة الوطني";

// Section ids scrollToId looks for on the homepage — "home" maps to the hero
// itself, matching Header's own logo-click behaviour.
const SECTION_ANCHOR: Record<string, string> = {
  home: "hero",
  biography: "biography",
  media: "media",
  contact: "contact",
};

export interface FooterClientProps {
  nameKu: string | null;
  nameEn: string | null;
  nameAr: string | null;
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
}

export function FooterClient({
  nameKu,
  nameEn,
  nameAr,
  email,
  phone,
  mapUrl,
  locationKu,
  locationEn,
  locationAr,
  socials,
  openWeekdays,
  timeSlots,
}: FooterClientProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
  const tBooking = useTranslations("booking");
  const pathname = usePathname();
  const router = useRouter();
  const year = new Date().getFullYear();

  const name =
    locale === "en" ? nameEn || FALLBACK_NAME_EN : locale === "ar" ? nameAr || FALLBACK_NAME_AR : nameKu || FALLBACK_NAME_KU;
  const location = locale === "en" ? locationEn : locale === "ar" ? locationAr : locationKu;

  function handleSectionClick(id: string) {
    const anchor = SECTION_ANCHOR[id] ?? id;
    if (pathname === "/") {
      scrollToId(anchor);
    } else {
      router.push(`/#${anchor}`);
    }
  }

  const weekdayLabels = tBooking.raw("weekdays") as string[];
  const meridiem = tBooking.raw("meridiem") as { am: string; pm: string };
  const { daysText, hoursText } = formatVisitingHours({
    openWeekdays,
    timeSlots,
    locale,
    weekdayLabels,
    meridiem,
    closedLabel: t("hoursClosed"),
  });

  const quickLinks: { id: string; label: string; href?: "/booking" }[] = [
    { id: "home", label: tNav("home") },
    { id: "biography", label: tNav("biography") },
    { id: "media", label: tNav("media") },
    { id: "booking", label: tNav("booking"), href: "/booking" },
    { id: "contact", label: tNav("contact") },
  ];

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="h-[3px] w-full bg-[#850B10]" />

      <div className="container-art section-px py-16 sm:py-20">
        <div className="grid gap-12 sm:grid-cols-2 sm:gap-10 lg:grid-cols-[1.3fr_0.9fr_1fr_1.1fr] lg:gap-8">
          {/* Col 1 — About & branding */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <Image
                src="/images/logo/logo.png"
                alt=""
                width={96}
                height={96}
                className="h-12 w-12 shrink-0 object-contain"
              />
              <span className="font-display text-fluid-base font-semibold leading-tight text-white">
                {name}
              </span>
            </Link>
            <p className="text-fluid-sm font-medium text-pigment-gold">{t("tagline")}</p>
            <p className="max-w-xs text-fluid-xs leading-relaxed text-gray-400">{t("about")}</p>
          </div>

          {/* Col 2 — Quick navigation */}
          <div className="flex flex-col gap-4">
            <h3 className="text-fluid-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
              {t("quickNavHeading")}
            </h3>
            <ul className="flex flex-col gap-2.5">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  {link.href ? (
                    <Link
                      href={link.href}
                      className="text-fluid-sm text-gray-400 transition-colors hover:text-pigment-gold"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSectionClick(link.id)}
                      className="text-fluid-sm text-gray-400 transition-colors hover:text-pigment-gold"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Visiting hours */}
          <div className="flex flex-col gap-4">
            <h3 className="flex items-center gap-2 text-fluid-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
              <Clock size={14} className="text-pigment-gold" />
              {t("hoursHeading")}
            </h3>
            <div className="flex flex-col gap-1.5 rounded-xl border border-gray-800 bg-white/[0.03] px-4 py-3.5">
              <span className="text-fluid-sm font-medium text-white">{daysText}</span>
              <span className="text-fluid-sm text-gray-400">{hoursText}</span>
            </div>
          </div>

          {/* Col 4 — Contact & location */}
          <div className="flex flex-col gap-4">
            <h3 className="text-fluid-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
              {t("contactHeading")}
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="flex items-start gap-2.5">
                <MapPin size={16} className="mt-0.5 shrink-0 text-pigment-gold" />
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-fluid-sm text-gray-400 transition-colors hover:text-pigment-gold"
                  >
                    {location}
                  </a>
                ) : (
                  <span className="text-fluid-sm text-gray-400">{location}</span>
                )}
              </li>
              {phone && (
                <li className="flex items-start gap-2.5">
                  <Phone size={16} className="mt-0.5 shrink-0 text-pigment-gold" />
                  <a
                    href={`tel:${phone}`}
                    dir="ltr"
                    className="text-fluid-sm text-gray-400 transition-colors hover:text-pigment-gold"
                  >
                    {phone}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2.5">
                <Mail size={16} className="mt-0.5 shrink-0 text-pigment-gold" />
                <a
                  href={`mailto:${email}`}
                  dir="ltr"
                  className="text-fluid-sm text-gray-400 transition-colors hover:text-pigment-gold"
                >
                  {email}
                </a>
              </li>
            </ul>

            {(socials.length > 0 || mapUrl) && (
              <div className="flex items-center gap-2.5 pt-1">
                {socials.map((s) => (
                  <a
                    key={s.type}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition-colors hover:border-pigment-gold hover:text-pigment-gold"
                  >
                    <SocialIcon type={s.type} className="h-4 w-4" />
                  </a>
                ))}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Google Maps"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition-colors hover:border-pigment-gold hover:text-pigment-gold"
                  >
                    <MapPin size={16} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-14 border-t border-gray-800 pt-7 text-center">
          <span className="text-fluid-xs text-gray-500">
            © {year} {name} - {t("rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}
