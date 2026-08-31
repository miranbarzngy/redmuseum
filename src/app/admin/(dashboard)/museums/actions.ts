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
    intro_ku: String(formData.get("intro_ku") ?? "").trim(),
    intro_en: String(formData.get("intro_en") ?? "").trim(),
    intro_ar: String(formData.get("intro_ar") ?? "").trim(),
  });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museums?saved=1");
}

// Ordering is owned by the drag-and-drop list on /admin/museums (see
// reorderBiographyBlocks), never by the form — so sort_order isn't parsed
// here. New rows are appended at the end; edits leave sort_order untouched.
function parseBlockFields(formData: FormData) {
  const body_ku = String(formData.get("body_ku") ?? "").trim();
  if (!body_ku) {
    throw new Error("پەراگرافی کوردی پێویستە.");
  }

  return {
    title_ku: String(formData.get("title_ku") ?? "").trim(),
    title_en: String(formData.get("title_en") ?? "").trim(),
    title_ar: String(formData.get("title_ar") ?? "").trim(),
    body_ku,
    body_en: String(formData.get("body_en") ?? "").trim(),
    body_ar: String(formData.get("body_ar") ?? "").trim(),
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

  const { data: last } = await supabase
    .from("biography_blocks")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase
    .from("biography_blocks")
    .insert({ ...fields, ...images, sort_order });
  if (error) throw new Error(error.message);

  revalidatePublicSite();
  redirect("/admin/museums?saved=1");
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
  redirect("/admin/museums?saved=1");
}

export async function deleteBiographyBlock(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("biography_blocks").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidatePublicSite();
}

/** Persists a drag-and-drop reorder of the whole section list — `orderedIds`
 * is every block id in its new top-to-bottom order, each given its index as
 * sort_order. Mirrors reorderGalleryImages in the gallery actions. */
export async function reorderBiographyBlocks(orderedIds: string[]) {
  await requireAdminSession();
  const supabase = createAdminClient();

  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase.from("biography_blocks").update({ sort_order: index }).eq("id", id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidatePublicSite();
}
