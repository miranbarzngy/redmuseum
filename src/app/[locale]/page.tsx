import { HeaderServer } from "@/components/layout/HeaderServer";
import { Footer } from "@/components/layout/Footer";
import { ScrollExperience } from "@/components/background/ScrollExperience";
import { Hero } from "@/components/sections/Hero";
import { HeroLogoStrip } from "@/components/sections/HeroLogoStrip";
import { Biography } from "@/components/sections/Biography";
import { Gallery } from "@/components/sections/Gallery";
import { Contact } from "@/components/sections/Contact";

// Paintings/exhibitions/gallery come from Supabase; re-fetch at most once a
// minute so admin edits show up promptly without hitting the DB on every
// request. Admin mutations also call revalidatePath for immediate updates.
export const revalidate = 60;

export default function HomePage() {
  return (
    <>
      <HeaderServer solid />
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
