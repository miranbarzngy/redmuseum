"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAdminSession } from "@/lib/adminAuth";
import { createAdminClient } from "@/lib/supabase/admin";
import type { ContactMessageRow } from "@/lib/supabase/database.types";

// contact_messages holds visitor PII and has no public-read RLS policy at
// all (see supabase/migrations/0010_contact_messages.sql) — the anon client
// used elsewhere for admin list pages simply can't see this data. Reads
// live here, next to the writes, so every access to this table stays
// confined to this actions.ts file and gated by requireAdminSession(),
// matching where src/lib/supabase/admin.ts says createAdminClient() is
// allowed to be imported.

export async function getMessages(): Promise<ContactMessageRow[]> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getUnreadMessageCount(): Promise<number> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("contact_messages")
    .select("*", { count: "exact", head: true })
    .eq("is_read", false);

  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function getMessage(id: string): Promise<ContactMessageRow | null> {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data;
}

export async function markMessageRead(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase
    .from("contact_messages")
    .update({ is_read: true })
    .eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
}

export async function deleteMessage(id: string) {
  await requireAdminSession();
  const supabase = createAdminClient();
  const { error } = await supabase.from("contact_messages").delete().eq("id", id);

  if (error) throw new Error(error.message);
  revalidatePath("/admin/messages");
  revalidatePath("/admin");
  redirect("/admin/messages");
}
