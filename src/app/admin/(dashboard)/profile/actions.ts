"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { isHttpsUrl } from "@/lib/httpsUrl";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  BACKGROUND_PIECE_UPLOAD,
  removeUnusedArtwork,
  resolveGalleryImageUrls,
} from "@/lib/supabase/uploadImage";

/** A link field: empty, or an absolute https:// URL (see src/lib/httpsUrl.ts).
 * The form's inputs already enforce this in the browser, so this only trips
 * on a request that skipped the form. */
function linkField(formData: FormData, name: string): string {
  const value = String(formData.get(name) ?? "").trim();
  if (value && !isHttpsUrl(value)) {
    throw new Error("بەستەرەکان دەبێت بە https:// دەست پێبکەن.");
  }
  return value;
}

export async function updateProfile(formData: FormData) {
  await requireAdminSession(PERMISSIONS.profileManage);
  const supabase = createAdminClient();

  // Checked before any upload, so a bad link can't leave orphaned images
  // in storage behind the failed save.
  const links = {
    contact_map_url: linkField(formData, "contact_map_url"),
    social_instagram_url: linkField(formData, "social_instagram_url"),
    social_facebook_url: linkField(formData, "social_facebook_url"),
    social_x_url: linkField(formData, "social_x_url"),
    social_youtube_url: linkField(formData, "social_youtube_url"),
    social_tiktok_url: linkField(formData, "social_tiktok_url"),
    social_whatsapp_url: linkField(formData, "social_whatsapp_url"),
    guide_flyer_url: linkField(formData, "guide_flyer_url") || null,
  };

  const heroImageUrls = await resolveGalleryImageUrls(
    supabase,
    formData,
    "hero_image_urls_kept",
    "hero_image_gallery_files"
  );
  const backgroundImageUrls = await resolveGalleryImageUrls(
    supabase,
    formData,
    "background_image_urls_kept",
    "background_image_files",
    BACKGROUND_PIECE_UPLOAD
  );

  const { data: previous } = await supabase
    .from("site_profile")
    .select("hero_image_url, hero_image_urls, background_image_urls")
    .eq("id", 1)
    .maybeSingle();

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
    ...links,
    hero_image_url: heroImageUrls[0] ?? null,
    hero_image_urls: heroImageUrls,
    background_image_urls: backgroundImageUrls,
  });
  if (error) throw new Error(error.message);

  if (previous) {
    removeUnusedArtwork(supabase, [
      previous.hero_image_url,
      ...(previous.hero_image_urls ?? []),
      ...(previous.background_image_urls ?? []),
    ]);
  }
  revalidatePath("/admin/profile");
  revalidatePath("/[locale]", "layout");
  redirect("/admin/profile?saved=1");
}
