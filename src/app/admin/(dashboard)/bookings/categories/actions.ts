"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

// sort_order is owned by the drag-and-drop list (reorderVisitorTypes), not
// the form. The public booking form (BookingClient) renders label[locale]
// with no fallback, so all three label languages stay required.
function parseVisitorTypeFields(formData: FormData) {
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
  revalidatePath("/admin/bookings");
  revalidatePath("/admin/bookings/categories");
  revalidatePath("/[locale]", "layout");
}

export async function createVisitorType(formData: FormData) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const fields = parseVisitorTypeFields(formData);

  const { data: last } = await supabase
    .from("booking_visitor_types")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("booking_visitor_types").insert({ ...fields, sort_order });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/bookings/categories?saved=1");
}

export async function updateVisitorType(id: string, formData: FormData) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const fields = parseVisitorTypeFields(formData);

  const { error } = await supabase.from("booking_visitor_types").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/bookings/categories?saved=1");
}

export async function deleteVisitorType(id: string) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { error } = await supabase.from("booking_visitor_types").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}

/** Persists a drag-and-drop reorder — `orderedIds` is the full category list
 * in its new top-to-bottom order, each assigned its index as sort_order. */
export async function reorderVisitorTypes(orderedIds: string[]) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();

  const updates = orderedIds.map((id, index) =>
    supabase.from("booking_visitor_types").update({ sort_order: index }).eq("id", id)
  );
  const results = await Promise.all(updates);
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePublicSite();
}
