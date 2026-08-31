import { createClient } from "@/lib/supabase/server";
import { heroDefaults } from "@/lib/heroDefaults";
import { PageHeader } from "../../_components/PageHeader";
import { ProfileForm } from "./ProfileForm";
import { updateProfile } from "./actions";

export default async function AdminProfilePage() {
  const supabase = createClient();
  const { data: profile } = await supabase.from("site_profile").select("*").eq("id", 1).maybeSingle();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <PageHeader
        title="پرۆفایلی پەڕەی سەرەکی"
        description="ناو، دەربڕین، دەربارە و وێنەکانی پیشاندراو لە بەشی سەرەکی پەڕەی سەرەکیدا."
      />
      <ProfileForm action={updateProfile} profile={profile} homepageDefaults={heroDefaults} />
    </div>
  );
}
