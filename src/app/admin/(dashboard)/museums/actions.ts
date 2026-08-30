"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUploadedImageUrl, resolveUploadedImageUrls } from "@/lib/supabase/uploadImage";

function revalidatePublicSite() {
  revalidatePath("/admin/museums");
  revalidatePath("/[locale]", "layout");
}

export async function updateBiographyIntro(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const { error } = await supabase.from("biography_intro").upsert({
    id: 1,
    eyebrow_ku: String(formData.get("eyebrow_ku") ?? "").trim(),
    eyebrow_en: String(formData.get("eyebrow_en") ?? "").trim(),
    eyebrow_ar: String(formData.get("eyebrow_ar") ?? "").trim(),
    heading_ku: String(formData.get("heading_ku") ?? "").trim(),
    heading_en: String(formData.get("heading_en") ?? "").trim(),
    heading_ar: String(formData.get("heading_ar") ?? "").trim(),
    intro_ku: String(formData.get("intro_ku") ?? "").trim(),
    intro_en: String(formData.get("intro_en") ?? "").trim(),
    intro_ar: String(formData.get("intro_ar") ?? "").trim(),
  });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museums?saved=1");
}

function parseBlockFields(formData: FormData) {
  const sortOrder = Number(formData.get("sort_order"));

  return {
    body_ku: String(formData.get("body_ku") ?? "").trim(),
    body_en: String(formData.get("body_en") ?? "").trim(),
    body_ar: String(formData.get("body_ar") ?? "").trim(),
    sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
  };
}

/**
 * Two independent image fields:
 *   image_url  — the single main / cover photo (shown large on the section
 *                detail page and as the thumbnail in the homepage list).
 *   image_urls — an ordered list of *additional* photos (the cover is not
 *                part of this list). Kept-thumbnail hidden inputs plus any
 *                newly uploaded files.
 */
async function resolveBlockImages(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData
) {
  // A blank file input with the kept-URL hidden input still present returns
  // that URL; removing the main photo drops the hidden input, so this comes
  // back undefined → treated as "no cover".
  const mainUrl = await resolveUploadedImageUrl(
    supabase,
    formData,
    "main_image_file",
    "main_image_url_kept"
  );
  const image_url = mainUrl ?? null;

  const kept = formData
    .getAll("image_urls_kept")
    .map(String)
    .filter((url) => url && url !== image_url);
  const added = await resolveUploadedImageUrls(supabase, formData, "image_gallery_files");

  return { image_url, image_urls: [...kept, ...added] };
}

export async function createBiographyBlock(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseBlockFields(formData);
  const images = await resolveBlockImages(supabase, formData);

  const { error } = await supabase.from("biography_blocks").insert({ ...fields, ...images });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museums");
}

export async function updateBiographyBlock(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseBlockFields(formData);
  const images = await resolveBlockImages(supabase, formData);

  const { error } = await supabase
    .from("biography_blocks")
    .update({ ...fields, ...images })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museums");
}

export async function deleteBiographyBlock(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("biography_blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}
