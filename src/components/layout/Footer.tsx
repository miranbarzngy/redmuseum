import { getSiteProfile } from "@/lib/data/profile";
import { resolveSocials } from "@/data/socials";
import { contactDefaults } from "@/lib/contactDefaults";
import { FooterClient } from "./FooterClient";

// FooterClient itself is a client component (locale-aware formatting, nav
// clicks), so it can't read Supabase directly — this thin server wrapper
// fetches the admin-entered profile and hands the resolved values down as
// plain props, the same split HeaderServer uses.
export async function Footer() {
  const profile = await getSiteProfile();

  const email = profile?.contact_email?.trim() || contactDefaults.email;
  const phone = profile?.contact_phone?.trim() || contactDefaults.phone;
  const mapUrl = profile?.contact_map_url?.trim() || contactDefaults.mapUrl || null;
  // The footer's social row only has room for Facebook/Instagram/YouTube (+ a
  // Maps pin below) — X/Twitter stays exclusive to the Contact section.
  const socials = resolveSocials(profile).filter((s) => s.type !== "x");

  return (
    <FooterClient
      nameKu={profile?.name_ku ?? null}
      nameEn={profile?.name_en ?? null}
      nameAr={profile?.name_ar ?? null}
      email={email}
      phone={phone}
      mapUrl={mapUrl}
      locationKu={profile?.contact_location_ku?.trim() || contactDefaults.location.ku}
      locationEn={profile?.contact_location_en?.trim() || contactDefaults.location.en}
      locationAr={profile?.contact_location_ar?.trim() || contactDefaults.location.ar}
      socials={socials}
    />
  );
}
