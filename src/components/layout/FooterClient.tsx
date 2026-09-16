"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { scrollToId } from "@/lib/scrollTo";

export function FooterClient() {
  const tNav = useTranslations("nav");
  const tFooter = useTranslations("footer");
  const year = new Date().getFullYear();

  return (
    <footer className="relative overflow-hidden border-t border-ink/10 bg-canvas">
      {/* PaintCanvas's fixed background layer sits behind every section, but
          this footer's own opaque bg-canvas hides it completely — so this
          accent lives locally instead, rendered directly on the footer
          rather than relying on scroll-triggered timing. */}
      <div
        aria-hidden
        className="pointer-events-none absolute bottom-0 left-0 h-36 w-36 sm:h-48 sm:w-48"
      >
        <Image
          src="/images/backgroundanimationicon/2.png"
          alt=""
          fill
          sizes="192px"
          className="object-contain"
        />
      </div>

      <div className="container-art section-px flex flex-col gap-12 py-20 sm:gap-10 sm:py-16">
        <div className="flex flex-col items-start justify-between gap-10 md:flex-row md:items-center">
          <div className="flex flex-col gap-2">
            <button
              onClick={() => scrollToId("hero")}
              className="font-display text-fluid-base font-semibold tracking-tight text-ink"
            >
              {tNav("brand")}
            </button>
            <p className="max-w-sm text-fluid-sm text-ink-soft">{tFooter("tagline")}</p>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-t border-ink/10 pt-8 text-fluid-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:pt-6">
          <span>
            © {year} - {tFooter("rights")}
          </span>
        </div>
      </div>
    </footer>
  );
}
