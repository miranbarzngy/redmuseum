"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

function parseCategoryFields(formData: FormData) {
  const slug = String(formData.get("slug") ?? "").trim();
  const label_ku = String(formData.get("label_ku") ?? "").trim();
  const label_en = String(formData.get("label_en") ?? "").trim();
  const label_ar = String(formData.get("label_ar") ?? "").trim();

  if (!slug || !label_ku || !label_en || !label_ar) {
    throw new Error("ناسنامە (slug) و ناونیشان (بە هەر سێ زمانەکە) پێویستن.");
  }

  const sort_order = Number(formData.get("sort_order") ?? 0);

  return {
    slug,
    label_ku,
    label_en,
    label_ar,
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
  };
}

function revalidatePublicSite() {
  revalidatePath("/admin/press-categories");
  revalidatePath("/admin/press");
  revalidatePath("/[locale]", "layout");
}

export async function createCategory(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseCategoryFields(formData);

  const { error } = await supabase.from("press_categories").insert(fields);
  if (error) {
    if (error.code === "23505") throw new Error("ئەم ناسنامەیە (slug) پێشتر بەکارهاتووە.");
    throw new Error(error.message);
  }

  revalidatePublicSite();
  redirect("/admin/press-categories");
}

export async function updateCategory(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseCategoryFields(formData);

  const { error } = await supabase.from("press_categories").update(fields).eq("id", id);
  if (error) {
    if (error.code === "23505") throw new Error("ئەم ناسنامەیە (slug) پێشتر بەکارهاتووە.");
    throw new Error(error.message);
  }

  revalidatePublicSite();
  redirect("/admin/press-categories");
}

export async function deleteCategory(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("press_categories").delete().eq("id", id);
  if (error) {
    if (error.code === "23503") {
      throw new Error("ناتوانرێت ئەم پۆلە بسڕدرێتەوە، چونکە هێشتا بابەتی میدیای پەیوەستی هەیە.");
    }
    throw new Error(error.message);
  }

  revalidatePublicSite();
}
