import type { Metadata } from "next";
import localFont from "next/font/local";
import { StaleServiceWorkerCleanup } from "@/components/StaleServiceWorkerCleanup";
import "../globals.css";

// /admin lives outside the [locale] segment, so it's a separate root route
// tree with its own <html>/<body> — it isn't part of the localized
// storefront. The site owner uses this panel in Kurdish only, so unlike the
// public storefront it isn't locale-switchable — it's permanently ku/rtl.
//
// Loaded via next/font/local (rather than the manual @font-face in
// globals.css that the public [locale] pages use) so the admin panel gets
// Next's own font optimization/self-hosting pipeline independently.
//
// Points at kurdish.otf, not kurdish.ttf — the .ttf was deleted from the
// project; kurdish.otf (internally named "UniSalar_F_007", a Kurdish
// display font — despite the .otf extension it's actually TrueType-flavored
// internally, hence format detection here just works) is what's actually on
// disk now. Weight is pinned to 400 — this file's own OS/2.usWeightClass —
// since it's a single static weight, not a variable font; leaving weight
// unset would default the face to matching only 400 and skip it elsewhere,
// and 500 (the old kurdish.ttf's weight) would be wrong for this file.
const kurdishFont = localFont({
  src: "../../../public/font/kurdish.otf",
  variable: "--font-kurdish-local",
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "بەڕێوەبردن — ئەمنە سورەکە",
  robots: { index: false, follow: false },
};

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ku" dir="rtl" className={kurdishFont.variable}>
      <body className="bg-canvas font-kurdish text-ink antialiased">
        <StaleServiceWorkerCleanup />
        {children}
      </body>
    </html>
  );
}
