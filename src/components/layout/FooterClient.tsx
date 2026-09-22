"use client";

import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Mail, Phone, MapPin } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { scrollToId } from "@/lib/scrollTo";
import { SocialIcon } from "@/components/ui/SocialIcon";
import type { Locale } from "@/i18n/routing";
import type { SocialLink } from "@/data/socials";

const FALLBACK_NAME_KU = "مۆزەخانەی نیشتیمانی ئەمنە سورەکە";
const FALLBACK_NAME_EN = "National Museum Amnasuraka";
const FALLBACK_NAME_AR = "متحف أمنة سوركة الوطني";

// Section ids scrollToId looks for on the homepage — "home" maps to the hero
// itself, matching Header's own logo-click behaviour. Booking and Contact
// aren't homepage sections (they're their own routes), so they're not here.
const SECTION_ANCHOR: Record<string, string> = {
  home: "hero",
  biography: "biography",
  media: "media",
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
}: FooterClientProps) {
  const locale = useLocale() as Locale;
  const t = useTranslations("footer");
  const tNav = useTranslations("nav");
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

  const quickLinks: { id: string; label: string; href?: "/booking" | "/contact" }[] = [
    { id: "home", label: tNav("home") },
    { id: "biography", label: tNav("biography") },
    { id: "media", label: tNav("media") },
    { id: "booking", label: tNav("booking"), href: "/booking" },
    { id: "contact", label: tNav("contact"), href: "/contact" },
  ];

  return (
    <footer className="relative overflow-hidden bg-ink text-white">
      <div aria-hidden className="h-[3px] w-full bg-[#850B10]" />

      <div className="container-art section-px py-5 sm:py-6">
        <div className="grid gap-5 sm:grid-cols-2 sm:gap-5 lg:grid-cols-[1.3fr_0.9fr_1.1fr] lg:gap-5">
          {/* Col 1 — About & branding */}
          <div className="flex flex-col gap-1.5">
            <Link href="/" className="flex items-center gap-2">
              <Image
                src="/images/logo/logo.png"
                alt=""
                width={96}
                height={96}
                className="h-7 w-7 shrink-0 object-contain"
              />
              <span className="font-display text-fluid-xs font-semibold leading-tight text-white">
                {name}
              </span>
            </Link>
            <p className="text-fluid-xs font-medium text-pigment-gold">{t("tagline")}</p>
            <p className="max-w-xs text-fluid-xs leading-snug text-gray-400">{t("about")}</p>
          </div>

          {/* Col 2 — Quick navigation */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-fluid-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
              {t("quickNavHeading")}
            </h3>
            <ul className="flex flex-col gap-1">
              {quickLinks.map((link) => (
                <li key={link.id}>
                  {link.href ? (
                    <Link
                      href={link.href}
                      className="text-fluid-xs text-gray-400 transition-colors hover:text-pigment-gold"
                    >
                      {link.label}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSectionClick(link.id)}
                      className="text-fluid-xs text-gray-400 transition-colors hover:text-pigment-gold"
                    >
                      {link.label}
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3 — Contact & location */}
          <div className="flex flex-col gap-1.5">
            <h3 className="text-fluid-xs font-semibold uppercase tracking-[0.18em] text-gray-300">
              {t("contactHeading")}
            </h3>
            <ul className="flex flex-col gap-1.5">
              <li className="flex items-start gap-2">
                <MapPin size={12} className="mt-0.5 shrink-0 text-pigment-gold" />
                {mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="text-fluid-xs text-gray-400 transition-colors hover:text-pigment-gold"
                  >
                    {location}
                  </a>
                ) : (
                  <span className="text-fluid-xs text-gray-400">{location}</span>
                )}
              </li>
              {phone && (
                <li className="flex items-start gap-2">
                  <Phone size={12} className="mt-0.5 shrink-0 text-pigment-gold" />
                  <a
                    href={`tel:${phone}`}
                    dir="ltr"
                    className="text-fluid-xs text-gray-400 transition-colors hover:text-pigment-gold"
                  >
                    {phone}
                  </a>
                </li>
              )}
              <li className="flex items-start gap-2">
                <Mail size={12} className="mt-0.5 shrink-0 text-pigment-gold" />
                <a
                  href={`mailto:${email}`}
                  dir="ltr"
                  className="text-fluid-xs text-gray-400 transition-colors hover:text-pigment-gold"
                >
                  {email}
                </a>
              </li>
            </ul>

            {(socials.length > 0 || mapUrl) && (
              <div className="flex items-center gap-1.5 pt-0.5">
                {socials.map((s) => (
                  <a
                    key={s.type}
                    href={s.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label={s.label}
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition-colors hover:border-pigment-gold hover:text-pigment-gold"
                  >
                    <SocialIcon type={s.type} className="h-3 w-3" />
                  </a>
                ))}
                {mapUrl && (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noreferrer noopener"
                    aria-label="Google Maps"
                    className="flex h-6 w-6 items-center justify-center rounded-full border border-gray-700 text-gray-400 transition-colors hover:border-pigment-gold hover:text-pigment-gold"
                  >
                    <MapPin size={12} />
                  </a>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex flex-col items-center gap-1.5 border-t border-gray-800 pt-3 text-center">
          <span className="text-fluid-xs text-gray-500">
            © {year} {name} - {t("rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}
