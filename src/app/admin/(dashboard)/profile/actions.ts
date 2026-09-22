"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUploadedImageUrls } from "@/lib/supabase/uploadImage";
import { resolveUploadedDocumentUrl } from "@/lib/supabase/uploadDocument";

export async function updateProfile(formData: FormData) {
  await requireAdminSession(PERMISSIONS.profileManage);
  const supabase = createAdminClient();

  const keptHeroGalleryUrls = formData.getAll("hero_image_urls_kept").map(String);
  const newHeroGalleryUrls = await resolveUploadedImageUrls(supabase, formData, "hero_image_gallery_files");
  const heroImageUrls = [...keptHeroGalleryUrls, ...newHeroGalleryUrls];

  const guideFlyerUrl = await resolveUploadedDocumentUrl(
    supabase,
    formData,
    "guide_flyer_file",
    "guide_flyer_url"
  );

  const { error } = await supabase.from("site_profile").upsert({
    id: 1,
    eyebrow_ku: String(formData.get("eyebrow_ku") ?? "").trim(),
    eyebrow_en: String(formData.get("eyebrow_en") ?? "").trim(),
    eyebrow_ar: String(formData.get("eyebrow_ar") ?? "").trim(),
    name_ku: String(formData.get("name_ku") ?? "").trim(),
    name_en: String(formData.get("name_en") ?? "").trim(),
    name_ar: String(formData.get("name_ar") ?? "").trim(),
    statement_ku: String(formData.get("statement_ku") ?? "").trim(),
    statement_en: String(formData.get("statement_en") ?? "").trim(),
    statement_ar: String(formData.get("statement_ar") ?? "").trim(),
    statement_words_ku: formData
      .getAll("statement_words_ku")
      .map((word) => String(word).trim())
      .filter(Boolean),
    statement_words_en: formData
      .getAll("statement_words_en")
      .map((word) => String(word).trim())
      .filter(Boolean),
    statement_words_ar: formData
      .getAll("statement_words_ar")
      .map((word) => String(word).trim())
      .filter(Boolean),
    statement_suffix_ku: String(formData.get("statement_suffix_ku") ?? "").trim(),
    statement_suffix_en: String(formData.get("statement_suffix_en") ?? "").trim(),
    statement_suffix_ar: String(formData.get("statement_suffix_ar") ?? "").trim(),
    stat_museums_value: String(formData.get("stat_museums_value") ?? "").trim(),
    stat_museums_label_ku: String(formData.get("stat_museums_label_ku") ?? "").trim(),
    stat_museums_label_en: String(formData.get("stat_museums_label_en") ?? "").trim(),
    stat_museums_label_ar: String(formData.get("stat_museums_label_ar") ?? "").trim(),
    stat_archive_value: String(formData.get("stat_archive_value") ?? "").trim(),
    stat_archive_label_ku: String(formData.get("stat_archive_label_ku") ?? "").trim(),
    stat_archive_label_en: String(formData.get("stat_archive_label_en") ?? "").trim(),
    stat_archive_label_ar: String(formData.get("stat_archive_label_ar") ?? "").trim(),
    stat_activities_value: String(formData.get("stat_activities_value") ?? "").trim(),
    stat_activities_label_ku: String(formData.get("stat_activities_label_ku") ?? "").trim(),
    stat_activities_label_en: String(formData.get("stat_activities_label_en") ?? "").trim(),
    stat_activities_label_ar: String(formData.get("stat_activities_label_ar") ?? "").trim(),
    stat_visitors_value: String(formData.get("stat_visitors_value") ?? "").trim(),
    stat_visitors_label_ku: String(formData.get("stat_visitors_label_ku") ?? "").trim(),
    stat_visitors_label_en: String(formData.get("stat_visitors_label_en") ?? "").trim(),
    stat_visitors_label_ar: String(formData.get("stat_visitors_label_ar") ?? "").trim(),
    contact_email: String(formData.get("contact_email") ?? "").trim(),
    contact_phone: String(formData.get("contact_phone") ?? "").trim(),
    contact_location_ku: String(formData.get("contact_location_ku") ?? "").trim(),
    contact_location_en: String(formData.get("contact_location_en") ?? "").trim(),
    contact_location_ar: String(formData.get("contact_location_ar") ?? "").trim(),
    contact_map_url: String(formData.get("contact_map_url") ?? "").trim(),
    social_instagram_url: String(formData.get("social_instagram_url") ?? "").trim(),
    social_facebook_url: String(formData.get("social_facebook_url") ?? "").trim(),
    social_x_url: String(formData.get("social_x_url") ?? "").trim(),
    social_youtube_url: String(formData.get("social_youtube_url") ?? "").trim(),
    hero_image_url: heroImageUrls[0] ?? null,
    hero_image_urls: heroImageUrls,
    guide_flyer_url: guideFlyerUrl,
  });
  if (error) throw new Error(error.message);

  revalidatePath("/admin/profile");
  revalidatePath("/[locale]", "layout");
  redirect("/admin/profile?saved=1");
}
