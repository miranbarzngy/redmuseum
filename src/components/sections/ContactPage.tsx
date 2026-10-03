import { getSiteProfile } from "@/lib/data/profile";
import { resolveSocials } from "@/data/socials";
import { contactDefaults } from "@/lib/contactDefaults";
import { ContactPageClient } from "./ContactPageClient";

// Server wrapper for the standalone /contact route — same split as
// Footer/FooterClient: this fetches the admin-entered profile,
// ContactPageClient (client, for the form + locale-aware formatting) just
// renders the resolved values.
export async function ContactPage() {
  const profile = await getSiteProfile();

  const email = profile?.contact_email?.trim() || contactDefaults.email;
  const phone = profile?.contact_phone?.trim() || contactDefaults.phone;
  const mapUrl = profile?.contact_map_url?.trim() || contactDefaults.mapUrl || null;
  const socials = resolveSocials(profile).filter((s) => s.type !== "x");

  return (
    <ContactPageClient
      email={email}
      phone={phone}
      mapUrl={mapUrl}
      locationKu={profile?.contact_location_ku?.trim() || contactDefaults.location.ku}
      locationEn={profile?.contact_location_en?.trim() || contactDefaults.location.en}
      locationAr={profile?.contact_location_ar?.trim() || contactDefaults.location.ar}
      socials={socials}
      guideFlyerUrl={profile?.guide_flyer_url?.trim() || null}
    />
  );
}
