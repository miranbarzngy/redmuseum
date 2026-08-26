"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUploadedImageUrl } from "@/lib/supabase/uploadImage";

function parseGalleryFields(formData: FormData) {
  const category_id = String(formData.get("category_id") ?? "").trim();
  if (!category_id) {
    throw new Error("تکایە پۆلێک هەڵبژێرە.");
  }

  return {
    category_id,
    title: String(formData.get("title") ?? "").trim() || null,
    display_order: Number(formData.get("display_order") ?? 0) || 0,
    is_active: formData.get("is_active") === "on",
  };
}

function revalidatePublicSite() {
  revalidatePath("/admin/gallery");
  revalidatePath("/[locale]", "layout");
}

export async function createGalleryImage(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseGalleryFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file");

  if (!imageUrl) {
    throw new Error("تکایە وێنەیەک باربکە.");
  }

  const { error } = await supabase.from("gallery").insert({ ...fields, image_url: imageUrl });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/gallery");
}

export async function updateGalleryImage(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseGalleryFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file");

  const { error } = await supabase
    .from("gallery")
    .update({ ...fields, ...(imageUrl ? { image_url: imageUrl } : {}) })
    .eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/gallery");
}

export async function deleteGalleryImage(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}

/** Persists a drag-and-drop reorder within one category — `orderedIds` is
 * that category's full image list in its new top-to-bottom order, each
 * assigned its index as display_order. */
export async function reorderGalleryImages(orderedIds: string[]) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const updates = orderedIds.map((id, index) =>
    supabase.from("gallery").update({ display_order: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePublicSite();
}
