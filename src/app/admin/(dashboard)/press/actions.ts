"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUploadedImageUrl } from "@/lib/supabase/uploadImage";

function parsePressFields(formData: FormData) {
  const category_id = String(formData.get("category_id") ?? "").trim();
  if (!category_id) {
    throw new Error("تکایە پۆلێک هەڵبژێرە.");
  }

  const source = String(formData.get("source") ?? "").trim();
  const url = String(formData.get("url") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const title_ku = String(formData.get("title_ku") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const title_ar = String(formData.get("title_ar") ?? "").trim();

  if (!source || !url || !date || !title_ku || !title_en || !title_ar) {
    throw new Error("سەرچاوە، لینک، بەروار و ناونیشان (بە هەر سێ زمانەکە) پێویستن.");
  }

  return {
    category_id,
    source,
    url,
    date,
    title_ku,
    title_en,
    title_ar,
    excerpt_ku: String(formData.get("excerpt_ku") ?? "").trim(),
    excerpt_en: String(formData.get("excerpt_en") ?? "").trim(),
    excerpt_ar: String(formData.get("excerpt_ar") ?? "").trim(),
  };
}

function revalidatePublicSite() {
  revalidatePath("/admin/press");
  revalidatePath("/[locale]", "layout");
}

export async function createPressItem(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parsePressFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file", "image_url");

  const { error } = await supabase
    .from("press_media")
    .insert({ ...fields, image_url: imageUrl ?? null });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/press");
}

export async function updatePressItem(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parsePressFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file", "image_url");

  const { error } = await supabase
    .from("press_media")
    .update({
      ...fields,
      ...(imageUrl !== undefined ? { image_url: imageUrl } : {}),
    })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/press");
}

export async function deletePressItem(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("press_media").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}
