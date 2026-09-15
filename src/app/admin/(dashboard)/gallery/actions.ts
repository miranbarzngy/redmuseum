"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { withAuditLog } from "@/lib/auditLogger";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { resolveUploadedImageUrl } from "@/lib/supabase/uploadImage";

// display_order is owned by the drag-and-drop list on /admin/gallery (see
// reorderGalleryImages) — it is per-category, so the form never sets it.
function parseGalleryFields(formData: FormData) {
  const category_id = String(formData.get("category_id") ?? "").trim();
  if (!category_id) {
    throw new Error("تکایە پۆلێک هەڵبژێرە.");
  }

  return {
    category_id,
    title: String(formData.get("title") ?? "").trim() || null,
    is_active: formData.get("is_active") === "on",
  };
}

function revalidatePublicSite() {
  revalidatePath("/admin/gallery");
  revalidatePath("/[locale]", "layout");
}

async function nextDisplayOrder(
  supabase: ReturnType<typeof createAdminClient>,
  categoryId: string
) {
  const { data: last } = await supabase
    .from("gallery")
    .select("display_order")
    .eq("category_id", categoryId)
    .order("display_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  return (last?.display_order ?? -1) + 1;
}

export async function createGalleryImage(formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.galleryManage);
  const supabase = createAdminClient();
  const fields = parseGalleryFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file");

  if (!imageUrl) {
    throw new Error("تکایە وێنەیەک باربکە.");
  }

  await withAuditLog(session, "create_gallery_image", "gallery", async () => {
    const display_order = await nextDisplayOrder(supabase, fields.category_id);
    const { data, error } = await supabase
      .from("gallery")
      .insert({ ...fields, display_order, image_url: imageUrl })
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: data.id, after: data };
  });

  revalidatePublicSite();
  redirect("/admin/gallery?saved=1");
}

export async function updateGalleryImage(id: string, formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.galleryManage);
  const supabase = createAdminClient();
  const fields = parseGalleryFields(formData);
  const imageUrl = await resolveUploadedImageUrl(supabase, formData, "image_file");

  await withAuditLog(session, "update_gallery_image", "gallery", async () => {
    const { data: before } = await supabase.from("gallery").select().eq("id", id).maybeSingle();
    const { data: after, error } = await supabase
      .from("gallery")
      .update({ ...fields, ...(imageUrl ? { image_url: imageUrl } : {}) })
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before, after };
  });

  revalidatePublicSite();
  redirect("/admin/gallery?saved=1");
}

export async function deleteGalleryImage(id: string) {
  const session = await requireAdminSession(PERMISSIONS.galleryManage);
  const supabase = createAdminClient();

  await withAuditLog(session, "delete_gallery_image", "gallery", async () => {
    const { data: before } = await supabase.from("gallery").select().eq("id", id).maybeSingle();
    const { error } = await supabase.from("gallery").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before };
  });

  revalidatePublicSite();
}

/** Persists a drag-and-drop reorder within one category — `orderedIds` is
 * that category's full image list in its new top-to-bottom order, each
 * assigned its index as display_order. */
export async function reorderGalleryImages(orderedIds: string[]) {
  const session = await requireAdminSession(PERMISSIONS.galleryManage);
  const supabase = createAdminClient();

  await withAuditLog(session, "reorder_gallery_images", "gallery", async () => {
    const updates = orderedIds.map((id, index) =>
      supabase.from("gallery").update({ display_order: index }).eq("id", id)
    );
    const results = await Promise.all(updates);
    const failed = results.find((r) => r.error);
    if (failed?.error) throw new Error(failed.error.message);
    return { result: undefined, after: { orderedIds } };
  });

  revalidatePublicSite();
}
