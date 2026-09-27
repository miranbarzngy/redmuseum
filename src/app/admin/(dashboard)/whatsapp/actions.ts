"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import type { WhatsAppTemplateRow } from "@/lib/supabase/database.types";
import { WHATSAPP_MESSAGE_MAX_LENGTH, WHATSAPP_TITLE_MAX_LENGTH } from "../bookings/whatsAppMessage";

// whatsapp_templates (0067) has no public-read policy — every read and write
// goes through here, gated on the same bookingsManage permission as the
// bookings board that sends them. sort_order is owned by the drag-and-drop
// grid (reorderWhatsAppTemplates), not the form; the first one is what the
// send sheet preselects.

function parseTemplateFields(formData: FormData) {
  const title = String(formData.get("title") ?? "").trim().slice(0, WHATSAPP_TITLE_MAX_LENGTH);
  const body = String(formData.get("body") ?? "")
    .replace(/\r\n/g, "\n")
    .trim()
    .slice(0, WHATSAPP_MESSAGE_MAX_LENGTH);

  if (!title || !body) {
    throw new Error("ناونیشان و دەقی پەیام پێویستن.");
  }

  return { title, body };
}

function revalidateTemplates() {
  revalidatePath("/admin/whatsapp");
  revalidatePath("/admin/bookings");
}

export async function listWhatsAppTemplates(): Promise<WhatsAppTemplateRow[]> {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("whatsapp_templates")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getWhatsAppTemplate(id: string): Promise<WhatsAppTemplateRow | null> {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { data, error } = await supabase.from("whatsapp_templates").select("*").eq("id", id).maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function createWhatsAppTemplate(formData: FormData) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const fields = parseTemplateFields(formData);

  const { data: last } = await supabase
    .from("whatsapp_templates")
    .select("sort_order")
    .order("sort_order", { ascending: false })
    .limit(1)
    .maybeSingle();
  const sort_order = (last?.sort_order ?? -1) + 1;

  const { error } = await supabase.from("whatsapp_templates").insert({ ...fields, sort_order });
  if (error) throw new Error(error.message);

  revalidateTemplates();
  redirect("/admin/whatsapp?saved=1");
}

export async function updateWhatsAppTemplate(id: string, formData: FormData) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const fields = parseTemplateFields(formData);

  const { error } = await supabase.from("whatsapp_templates").update(fields).eq("id", id);
  if (error) throw new Error(error.message);

  revalidateTemplates();
  redirect("/admin/whatsapp?saved=1");
}

export async function deleteWhatsAppTemplate(id: string) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();
  const { error } = await supabase.from("whatsapp_templates").delete().eq("id", id);
  if (error) throw new Error(error.message);

  revalidateTemplates();
}

/** Persists a drag-and-drop reorder — `orderedIds` is the full list in its
 * new top-to-bottom order, each assigned its index as sort_order. */
export async function reorderWhatsAppTemplates(orderedIds: string[]) {
  await requireAdminSession(PERMISSIONS.bookingsManage);
  const supabase = createAdminClient();

  const results = await Promise.all(
    orderedIds.map((id, index) => supabase.from("whatsapp_templates").update({ sort_order: index }).eq("id", id))
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) throw new Error(failed.error.message);

  revalidateTemplates();
}
