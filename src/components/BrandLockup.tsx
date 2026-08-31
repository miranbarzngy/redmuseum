import Image from "next/image";

const BRAND_NAME_KU = "مۆزەخانەی نیشتیمانی ئەمنە سورەکە";
const BRAND_NAME_EN = "National Museum Amnasuraka";

/**
 * Bilingual logo + wordmark lockup — mirrors the site header's lockup so
 * the booking confirmation card and the public status page read as
 * official. Plain (non-"use client") so it works in both server and
 * client trees. The wordmark stays Kurdish + English regardless of the
 * active locale, exactly like the header.
 */
export function BrandLockup({ className }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center gap-2.5 ${className ?? ""}`}>
      <Image
        src="/images/logo/logo.png"
        alt=""
        width={96}
        height={96}
        className="h-9 w-9 shrink-0 object-contain"
      />
      <span className="flex flex-col items-start">
        <span className="font-kurdish text-fluid-xs font-semibold leading-tight text-ink">
          {BRAND_NAME_KU}
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-ink-faint">
          {BRAND_NAME_EN}
        </span>
      </span>
    </div>
  );
}
