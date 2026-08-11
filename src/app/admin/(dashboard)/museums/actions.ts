"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUploadedImageUrl } from "@/lib/supabase/uploadImage";

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

export async function createBiographyBlock(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseBlockFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file", "image_url");

  const { error } = await supabase.from("biography_blocks").insert({ ...fields, image_url: imageUrl ?? null });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museums");
}

export async function updateBiographyBlock(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseBlockFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file", "image_url");

  const { error } = await supabase
    .from("biography_blocks")
    .update({ ...fields, ...(imageUrl !== undefined ? { image_url: imageUrl } : {}) })
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
