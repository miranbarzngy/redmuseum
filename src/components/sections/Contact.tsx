import { getSiteProfile } from "@/lib/data/profile";
import { contactDefaults } from "@/lib/contactDefaults";
import { ContactClient } from "./ContactClient";

// Server wrapper — same split as Footer/ContactPage: this fetches the
// admin-entered profile so the info cards (phone/address/email) show real
// values, ContactClient (client, for the form + locale-aware formatting)
// just renders what's resolved here.
export async function Contact() {
  const profile = await getSiteProfile();

  const email = profile?.contact_email?.trim() || contactDefaults.email;
  const phone = profile?.contact_phone?.trim() || contactDefaults.phone;
  const mapUrl = profile?.contact_map_url?.trim() || contactDefaults.mapUrl || null;

  return (
    <ContactClient
      email={email}
      phone={phone}
      mapUrl={mapUrl}
      locationKu={profile?.contact_location_ku?.trim() || contactDefaults.location.ku}
      locationEn={profile?.contact_location_en?.trim() || contactDefaults.location.en}
      locationAr={profile?.contact_location_ar?.trim() || contactDefaults.location.ar}
      guideFlyerUrl={profile?.guide_flyer_url?.trim() || null}
    />
  );
}
