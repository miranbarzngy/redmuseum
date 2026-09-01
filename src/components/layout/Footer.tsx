import { getSiteProfile } from "@/lib/data/profile";
import { resolveSocials } from "@/data/socials";
import { FooterClient } from "./FooterClient";

export async function Footer() {
  const profile = await getSiteProfile();
  return <FooterClient socials={resolveSocials(profile)} />;
}
