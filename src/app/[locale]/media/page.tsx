import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
import { MediaPressClient } from "@/components/sections/MediaPressClient";
import { getPressItems, getPressCategories } from "@/lib/data/press";
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
  const t = await getTranslations({ locale, namespace: "media" });

  return {
    title: t("heading"),
    description: t("subheading"),
  };
}

export default async function MediaPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [items, categories] = await Promise.all([getPressItems(), getPressCategories()]);

  return (
    <>
      <HeaderServer />
      <ScrollExperience>
        <main>
          <MediaPressClient items={items} categories={categories} />
        </main>
        <Footer />
      </ScrollExperience>
    </>
  );
}
