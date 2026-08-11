import { getSiteProfile } from "@/lib/data/profile";
import { ContactClient } from "./ContactClient";

export async function Contact() {
  const profile = await getSiteProfile();
  return <ContactClient profile={profile} />;
}
