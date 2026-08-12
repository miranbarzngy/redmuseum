import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
import { Booking } from "@/components/sections/Booking";
import { routing } from "@/i18n/routing";

export const revalidate = 60;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });

  return {
    title: t("heading"),
    description: t("subheading"),
  };
}

export default async function BookingPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);

  return (
    <>
      <HeaderServer />
      <ScrollExperience>
        <main>
          <Booking />
        </main>
        <Footer />
      </ScrollExperience>
    </>
  );
}
