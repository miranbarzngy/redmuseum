import { getSiteProfile } from "@/lib/data/profile";
import { HeroClient } from "./HeroClient";

export async function Hero() {
  const profile = await getSiteProfile();
  return <HeroClient profile={profile} />;
}
