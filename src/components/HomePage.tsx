import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
import { HomeSectionUrlSync } from "@/components/HomeSectionUrlSync";
import { Hero } from "@/components/sections/Hero";
import { HeroLogoStrip } from "@/components/sections/HeroLogoStrip";
import { Biography } from "@/components/sections/Biography";
import { Gallery } from "@/components/sections/Gallery";
import { Contact } from "@/components/sections/Contact";

/** The homepage, shared by /[locale] and the per-section URLs
 * (/[locale]/museums etc.), which open it at `initialSectionId`. */
export function HomePage({ initialSectionId }: { initialSectionId?: string }) {
  return (
    <>
      <HeaderServer solid />
      <HomeSectionUrlSync initialSectionId={initialSectionId} />
      <ScrollExperience>
        <main>
          <Hero />
          <HeroLogoStrip />
          <Biography />
          <Gallery />
          <Contact />
        </main>
        <Footer />
      </ScrollExperience>
    </>
  );
}
