import { getSiteProfile } from "@/lib/data/profile";
import { Header } from "./Header";

// Header itself is a client component (scroll listener, mobile menu state),
// so it can't fetch Supabase data directly — this thin server wrapper
// fetches the admin-entered profile name and hands it down as props.
export async function HeaderServer({ solid = false }: { solid?: boolean } = {}) {
  const profile = await getSiteProfile();
  return <Header solid={solid} nameKu={profile?.name_ku ?? null} nameEn={profile?.name_en ?? null} />;
}
