"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";

// Ordering is owned by the drag-and-drop list on /admin/museumhistory (see
// reorderExhibitions) — not the form. The public timeline
// (ExhibitionsTimeline) renders title[locale] with no fallback, so all
// three title languages stay required.
function parseExhibitionFields(formData: FormData) {
  const year = String(formData.get("year") ?? "").trim();
  const title_ku = String(formData.get("title_ku") ?? "").trim();
  const title_en = String(formData.get("title_en") ?? "").trim();
  const title_ar = String(formData.get("title_ar") ?? "").trim();

  if (!year || !title_ku || !title_en || !title_ar) {
    throw new Error("ساڵ و ناونیشان (بە هەر سێ زمانەکە) پێویستن.");
  }

  return {
    year,
    title_ku,
    title_en,
    title_ar,
    details_ku: String(formData.get("details_ku") ?? "").trim(),
    details_en: String(formData.get("details_en") ?? "").trim(),
    details_ar: String(formData.get("details_ar") ?? "").trim(),
  };
}

function revalidatePublicSite() {
  revalidatePath("/admin/museumhistory");
  revalidatePath("/[locale]", "layout");
}

export async function createExhibition(formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseExhibitionFields(formData);

  const { data: last } = await supabase
    .from("exhibitions")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("exhibitions").insert({ ...fields, sort_order });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museumhistory?saved=1");
}

export async function updateExhibition(id: string, formData: FormData) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const fields = parseExhibitionFields(formData);

  const { error } = await supabase.from("exhibitions").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museumhistory?saved=1");
}

export async function deleteExhibition(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("exhibitions").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}

/** Persists a drag-and-drop reorder of the whole list — `orderedIds` is
 * every exhibition id in its new order, each given its index as sort_order. */
export async function reorderExhibitions(orderedIds: string[]) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("exhibitions").update({ sort_order: index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePublicSite();
}
