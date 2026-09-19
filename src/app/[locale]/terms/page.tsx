import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
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
  const t = await getTranslations({ locale, namespace: "legal" });
  return { title: t("termsTitle") };
}

export default async function TermsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "legal" });

  return (
    <>
      <HeaderServer />
      <ScrollExperience>
        <main className="flex min-h-screen flex-col justify-center py-32">
          <div className="container-art section-px max-w-3xl">
            <h1 className="font-display text-fluid-2xl font-semibold text-ink">{t("termsTitle")}</h1>
            <p className="mt-6 text-fluid-sm leading-relaxed text-ink-soft">{t("termsBody")}</p>
          </div>
        </main>
        <Footer />
      </ScrollExperience>
    </>
  );
}
