import { getSiteProfile } from "@/lib/data/profile";
import { getBiographyBlocks } from "@/lib/data/biography";
import { Header } from "./Header";

// Header itself is a client component (scroll listener, mobile menu state),
// so it can't fetch Supabase data directly — this thin server wrapper
// fetches the admin-entered profile name plus the museum section list and
// hands them down as props.
export async function HeaderServer({ solid = false }: { solid?: boolean } = {}) {
  const [profile, blocks] = await Promise.all([getSiteProfile(), getBiographyBlocks()]);

  const sections = blocks.map((b) => ({
    id: b.id,
    title_ku: b.title_ku,
    title_en: b.title_en,
    title_ar: b.title_ar,
  }));

  return (
    <Header
      solid={solid}
      nameKu={profile?.name_ku ?? null}
      nameEn={profile?.name_en ?? null}
      sections={sections}
    />
  );
}
