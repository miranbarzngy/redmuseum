"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

function parseExhibitionFields(formData: FormData) {
  const year = String(formData.get("year") ?? "").trim();
  const title_ku = String(formData.get("title_ku") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const title_ar = String(formData.get("title_ar") ?? "").trim();

  if (!year || !title_ku || !title_en || !title_ar) {
    throw new Error("ساڵ و ناونیشان (بە هەر سێ زمانەکە) پێویستن.");
  }

  const sort_order = Number(formData.get("sort_order") ?? 0);

  return {
    year,
    title_ku,
    title_en,
    title_ar,
    details_ku: String(formData.get("details_ku") ?? "").trim(),
    details_en: String(formData.get("details_en") ?? "").trim(),
    details_ar: String(formData.get("details_ar") ?? "").trim(),
    sort_order: Number.isFinite(sort_order) ? sort_order : 0,
  };
}

function revalidatePublicSite() {
  revalidatePath("/admin/exhibitions");
  revalidatePath("/[locale]", "layout");
}

export async function createExhibition(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseExhibitionFields(formData);

  const { error } = await supabase.from("exhibitions").insert(fields);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/exhibitions");
}

export async function updateExhibition(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseExhibitionFields(formData);

  const { error } = await supabase.from("exhibitions").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/exhibitions");
}

export async function deleteExhibition(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("exhibitions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}
