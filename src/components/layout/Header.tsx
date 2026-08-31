"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import { useLocale, useTranslations } from "next-intl";
import { ChevronDown, Menu, X } from "lucide-react";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { scrollToId } from "@/lib/scrollTo";
import { pickSectionTitle } from "@/lib/museumSectionTitle";
import type { Locale } from "@/i18n/routing";

// Homepage sections, scrolled to in place.
const SECTION_IDS = ["biography", "media", "contact"] as const;
// Booking is its own route (/booking), not a homepage section, so it
// navigates instead of scrolling — this way clicking it works the same from
// any page, not just when already on the homepage.

export interface HeaderSection {
  id: string;
  title_ku: string;
  title_en: string;
  title_ar: string;
}

interface HeaderProps {
  solid?: boolean;
  /** Admin-entered profile name (site_profile.name_ku/name_en) for the header
   * wordmark. Null falls back to the fixed brand strings below — either
   * because the admin hasn't filled in the profile yet, or (on /media pages)
   * because HeaderServer wasn't used. */
  nameKu?: string | null;
  nameEn?: string | null;
  /** Museum sections (biography_blocks) for the "Museum sections" nav
   * dropdown — each links to its own /museum/[id] detail page. */
  sections?: HeaderSection[];
}

const FALLBACK_NAME_KU = "مۆزەخانەی نیشتیمانی ئەمنە سورەکە";
const FALLBACK_NAME_EN = "Amnasuraka National Museum";

const ACCENT = "#850B10";

export function Header({
  solid = false,
  nameKu = null,
  nameEn = null,
  sections = [],
}: HeaderProps = {}) {
  const t = useTranslations("nav");
  const tMuseum = useTranslations("museum");
  const locale = useLocale() as Locale;
  const pathname = usePathname();
  const router = useRouter();
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [sectionsOpen, setSectionsOpen] = useState(false);
  const [mobileSectionsOpen, setMobileSectionsOpen] = useState(false);
  const sectionsRef = useRef<HTMLDivElement>(null);

  useMotionValueEvent(scrollY, "change", (latest) => {
    setScrolled(latest > 48);
  });

  // Close the desktop sections dropdown on Escape or a click outside it.
  useEffect(() => {
    if (!sectionsOpen) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setSectionsOpen(false);
    }
    function onPointerDown(e: PointerEvent) {
      if (sectionsRef.current && !sectionsRef.current.contains(e.target as Node)) {
        setSectionsOpen(false);
      }
    }
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointerDown);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointerDown);
    };
  }, [sectionsOpen]);

  function handleNavClick(id: string) {
    setMenuOpen(false);
    setSectionsOpen(false);
    setMobileSectionsOpen(false);
    scrollToId(id);
  }

  // Clicking the logo/wordmark should always land on the homepage — a
  // smooth scroll-to-top when already there, an actual navigation from any
  // other route (e.g. /booking), where "hero" doesn't exist to scroll to.
  function handleLogoClick() {
    setMenuOpen(false);
    setSectionsOpen(false);
    if (pathname === "/") {
      scrollToId("hero");
    } else {
      router.push("/");
    }
  }

  // `solid` is for pages whose hero is a full-bleed dark photo (the nav's
  // text is always dark-ink, which disappears over that photo in the
  // "transparent, not yet scrolled" state) — it forces the same translucent
  // backdrop the header gets once scrolled, so there's always a light scrim
  // behind the dark text. Pages with a plain canvas-colored top (e.g. /media)
  // keep the normal transparent-until-scroll behavior.
  const showBackdrop = solid || scrolled;
  const hasSections = sections.length > 0;

  return (
    <header className="fixed inset-x-0 top-0 z-50">
      <div
        className={`transition-all duration-500 ${
          showBackdrop
            ? "border-b border-ink/10 bg-[#AAABAF] shadow-ring backdrop-blur-lg"
            : "border-b border-transparent bg-transparent"
        }`}
      >
        <div className="container-art section-px flex h-20 items-center justify-between">
          <button
            onClick={handleLogoClick}
            aria-label={t("brand")}
            className="flex shrink-0 items-center gap-2.5"
          >
            <Image
              src="/images/logo/logo.png"
              alt=""
              width={200}
              height={200}
              priority
              className="h-11 w-11 object-contain sm:h-12 sm:w-12"
            />
            {/* Fixed bilingual wordmark lockup — a logo doesn't switch
                language with the rest of the site, so this stays Kurdish +
                English regardless of the active locale. */}
            <span className="flex flex-col items-start">
              <span className="font-kurdish text-fluid-xs font-semibold leading-tight text-[#2E2F33]">
                {nameKu ?? FALLBACK_NAME_KU}
              </span>
              <span className="text-[10px] font-medium uppercase tracking-wider text-[#6B6C70]">
                {nameEn ?? FALLBACK_NAME_EN}
              </span>
            </span>
          </button>

          <nav className="hidden items-center gap-9 lg:flex">
            <Link
              href="/"
              className="text-fluid-sm font-medium text-[#2E2F33] transition-colors hover:text-[#850B10]"
            >
              {t("home")}
            </Link>
            {SECTION_IDS.map((id) =>
              id === "biography" && hasSections ? (
                <div
                  key={id}
                  ref={sectionsRef}
                  className="relative"
                  onMouseEnter={() => setSectionsOpen(true)}
                  onMouseLeave={() => setSectionsOpen(false)}
                >
                  <button
                    type="button"
                    onClick={() => setSectionsOpen((v) => !v)}
                    aria-expanded={sectionsOpen}
                    aria-haspopup="true"
                    className="inline-flex items-center gap-1.5 text-fluid-sm font-medium text-[#2E2F33] transition-colors hover:text-[#850B10]"
                  >
                    {t(id)}
                    <ChevronDown
                      size={14}
                      className={`transition-transform duration-200 ${
                        sectionsOpen ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  <AnimatePresence>
                    {sectionsOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        transition={{ duration: 0.16 }}
                        className="absolute end-0 top-full z-50 w-72 pt-2"
                      >
                        <div className="overflow-hidden rounded-2xl border border-ink/10 bg-[#FAFAF7] p-2 shadow-soft">
                          <button
                            type="button"
                            onClick={() => handleNavClick(id)}
                            className="mb-1 flex w-full items-center rounded-lg px-3 py-2 text-start text-fluid-xs font-semibold uppercase tracking-[0.15em] transition-colors hover:bg-ink/5"
                            style={{ color: ACCENT }}
                          >
                            {t(id)}
                          </button>
                          <ul className="flex flex-col">
                            {sections.map((s, i) => (
                              <li key={s.id}>
                                <Link
                                  href={`/museum/${s.id}`}
                                  onClick={() => setSectionsOpen(false)}
                                  className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-fluid-sm text-ink-soft transition-colors hover:bg-ink/5 hover:text-ink"
                                >
                                  <span
                                    className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold text-white"
                                    style={{ backgroundColor: ACCENT }}
                                  >
                                    {i + 1}
                                  </span>
                                  <span className="min-w-0 flex-1 truncate">
                                    {pickSectionTitle(s, locale) ||
                                      tMuseum("sectionLabel", { number: String(i + 1) })}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <button
                  key={id}
                  onClick={() => handleNavClick(id)}
                  className="text-fluid-sm font-medium text-[#2E2F33] transition-colors hover:text-[#850B10]"
                >
                  {t(id)}
                </button>
              )
            )}
            <Link
              href="/booking"
              className="text-fluid-sm font-medium text-[#2E2F33] transition-colors hover:text-[#850B10]"
            >
              {t("booking")}
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <LanguageSwitcher className="hidden sm:inline-flex" />
            <button
              type="button"
              onClick={() => setMenuOpen((v) => !v)}
              aria-label="Menu"
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-ink/10 text-[#2E2F33] lg:hidden"
            >
              {menuOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.25 }}
            className="border-b border-ink/10 bg-canvas/95 backdrop-blur-lg lg:hidden"
          >
            <nav className="section-px flex flex-col gap-1 py-4">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-3 text-start text-fluid-base font-medium text-ink-soft hover:bg-ink/5 hover:text-ink"
              >
                {t("home")}
              </Link>
              {SECTION_IDS.map((id) =>
                id === "biography" && hasSections ? (
                  <div key={id} className="flex flex-col">
                    <button
                      onClick={() => setMobileSectionsOpen((v) => !v)}
                      aria-expanded={mobileSectionsOpen}
                      className="flex items-center justify-between gap-2 rounded-lg px-2 py-3 text-start text-fluid-base font-medium text-ink-soft hover:bg-ink/5 hover:text-ink"
                    >
                      {t(id)}
                      <ChevronDown
                        size={16}
                        className={`transition-transform duration-200 ${
                          mobileSectionsOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence initial={false}>
                      {mobileSectionsOpen && (
                        <motion.ul
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden ps-3"
                        >
                          <li>
                            <button
                              onClick={() => handleNavClick(id)}
                              className="flex w-full items-center rounded-lg px-2 py-2.5 text-start text-fluid-sm font-semibold uppercase tracking-[0.15em] hover:bg-ink/5"
                              style={{ color: ACCENT }}
                            >
                              {t(id)}
                            </button>
                          </li>
                          {sections.map((s, i) => (
                            <li key={s.id}>
                              <Link
                                href={`/museum/${s.id}`}
                                onClick={() => setMenuOpen(false)}
                                className="flex items-center gap-2.5 rounded-lg px-2 py-2.5 text-start text-fluid-sm text-ink-soft hover:bg-ink/5 hover:text-ink"
                              >
                                <span
                                  className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[0.7rem] font-bold text-white"
                                  style={{ backgroundColor: ACCENT }}
                                >
                                  {i + 1}
                                </span>
                                <span className="min-w-0 flex-1 truncate">
                                  {pickSectionTitle(s, locale) ||
                                    tMuseum("sectionLabel", { number: String(i + 1) })}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <button
                    key={id}
                    onClick={() => handleNavClick(id)}
                    className="rounded-lg px-2 py-3 text-start text-fluid-base font-medium text-ink-soft hover:bg-ink/5 hover:text-ink"
                  >
                    {t(id)}
                  </button>
                )
              )}
              <Link
                href="/booking"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-2 py-3 text-start text-fluid-base font-medium text-ink-soft hover:bg-ink/5 hover:text-ink"
              >
                {t("booking")}
              </Link>
              <div className="px-2 pt-2">
                <LanguageSwitcher />
              </div>
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
