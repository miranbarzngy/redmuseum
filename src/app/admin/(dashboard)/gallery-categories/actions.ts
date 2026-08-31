"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

// sort_order is owned by the drag-and-drop list (reorderCategories), not the
// form. The public gallery (GalleryClient) renders label[locale] with no
// fallback, so all three label languages stay required.
function parseCategoryFields(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const label_ku = String(formData.get("label_ku") ?? "").trim();
  const label_en = String(formData.get("label_en") ?? "").trim();
  const label_ar = String(formData.get("label_ar") ?? "").trim();

  if (!slug || !label_ku || !label_en || !label_ar) {
    throw new Error("سلاگ و ناونیشان (بە هەر سێ زمانەکە) پێویستن.");
  }

  return { slug, label_ku, label_en, label_ar };
}

function revalidatePublicSite() {
  revalidatePath("/admin/gallery");
  revalidatePath("/admin/gallery-categories");
  revalidatePath("/[locale]", "layout");
}

export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseCategoryFields(formData);

  const { data: last } = await supabase
    .from("gallery_categories")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("gallery_categories").insert({ ...fields, sort_order });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/gallery-categories?saved=1");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseCategoryFields(formData);

  const { error } = await supabase.from("gallery_categories").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/gallery-categories?saved=1");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("gallery_categories").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}

/** Persists a drag-and-drop reorder — `orderedIds` is the full category list
 * in its new top-to-bottom order, each assigned its index as sort_order. */
export async function reorderCategories(orderedIds: string[]) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const updates = orderedIds.map((id, index) =>
    supabase.from("gallery_categories").update({ sort_order: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePublicSite();
}
