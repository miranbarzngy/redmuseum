import type { Metadata } from "next";
import { Vazirmatn } from "next/font/google";
import { NextIntlClientProvider, hasLocale } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import { routing, getDirection, type Locale } from "@/i18n/routing";
import { SmoothScrollProvider } from "@/lib/SmoothScrollProvider";
import { VisitTracker } from "@/components/VisitTracker";
import { StaleServiceWorkerCleanup } from "@/components/StaleServiceWorkerCleanup";
import "../globals.css";

const vazirmatn = Vazirmatn({
  subsets: ["arabic", "latin", "latin-ext"],
  variable: "--font-vazirmatn",
  display: "swap",
});

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta" });

  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  setRequestLocale(locale);
  const dir = getDirection(locale);

  return (
    <html lang={locale} dir={dir} className={vazirmatn.variable}>
      <head>
        {/* Remix Icons — used by the gallery section's category badges and lightbox controls */}
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/remixicon@4.2.0/fonts/remixicon.css" />
      </head>
      <body className="bg-canvas font-body text-ink antialiased">
        <NextIntlClientProvider>
          <StaleServiceWorkerCleanup />
          <VisitTracker />
          <SmoothScrollProvider>{children}</SmoothScrollProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}

export type { Locale };
