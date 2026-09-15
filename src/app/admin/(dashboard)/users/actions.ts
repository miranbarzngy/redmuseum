"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, hashPassword } from "@/lib/adminAuth";
import { withAuditLog } from "@/lib/auditLogger";
import { PERMISSIONS } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const USER_COLUMNS = "id, full_name, email, role_id, is_active, created_at";

function parseUserFields(formData: FormData) {
  const full_name = String(formData.get("full_name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const role_id = String(formData.get("role_id") ?? "").trim();
  if (!full_name || !email || !role_id) {
    throw new Error("تکایە هەموو خانەکان پڕبکەرەوە.");
  }
  return { full_name, email, role_id };
}

function parsePassword(formData: FormData, required: boolean) {
  const password = String(formData.get("password") ?? "");
  if (!password) {
    if (required) throw new Error("تکایە وشەی نهێنی بنووسە.");
    return null;
  }
  if (password.length < 8) {
    throw new Error("وشەی نهێنی دەبێت لانیکەم ٨ پیت بێت.");
  }
  return password;
}

export async function createUser(formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();
  const fields = parseUserFields(formData);
  const password = parsePassword(formData, true);

  await withAuditLog(session, "create_admin_user", "admin_users", async () => {
    const password_hash = await hashPassword(password!);
    const { data, error } = await supabase
      .from("admin_users")
      .insert({ ...fields, password_hash })
      .select(USER_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: data.id, after: data };
  });

  revalidatePath("/admin/users");
}

export async function updateUser(id: string, formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();
  const fields = parseUserFields(formData);
  const password = parsePassword(formData, false);

  await withAuditLog(session, "update_admin_user", "admin_users", async () => {
    const { data: before } = await supabase.from("admin_users").select(USER_COLUMNS).eq("id", id).maybeSingle();
    const password_hash = password ? await hashPassword(password) : undefined;
    const { data: after, error } = await supabase
      .from("admin_users")
      .update({ ...fields, ...(password_hash ? { password_hash } : {}) })
      .eq("id", id)
      .select(USER_COLUMNS)
      .single();
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before, after };
  });

  revalidatePath("/admin/users");
}

/** A separate, minimal action from updateUser — the "quick reset" affordance
 * on each user card. Deliberately never logs the password itself (hashed or
 * not) into admin_audit_logs.details — only that a reset happened. */
export async function resetUserPassword(id: string, formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();
  const password = parsePassword(formData, true);

  await withAuditLog(session, "reset_admin_user_password", "admin_users", async () => {
    const password_hash = await hashPassword(password!);
    const { error } = await supabase.from("admin_users").update({ password_hash }).eq("id", id);
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id };
  });
}

export async function setUserActive(id: string, isActive: boolean) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  if (id === session.id) {
    throw new Error("ناتوانیت هەژماری خۆت ناچالاک بکەیت.");
  }
  const supabase = createAdminClient();

  await withAuditLog(
    session,
    isActive ? "reactivate_admin_user" : "deactivate_admin_user",
    "admin_users",
    async () => {
      const { data: after, error } = await supabase
        .from("admin_users")
        .update({ is_active: isActive })
        .eq("id", id)
        .select("id, is_active")
        .single();
      if (error) throw new Error(error.message);
      return { result: undefined, targetId: id, after };
    }
  );

  revalidatePath("/admin/users");
}

function parseRoleFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("تکایە ناوی ڕۆڵ بنووسە.");
  const permissions = formData.getAll("permissions").map(String);
  return { name, permissions };
}

export async function createRole(formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();
  const fields = parseRoleFields(formData);

  await withAuditLog(session, "create_admin_role", "admin_roles", async () => {
    const { data, error } = await supabase.from("admin_roles").insert(fields).select().single();
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: data.id, after: data };
  });

  revalidatePath("/admin/users");
}

export async function updateRole(id: string, formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();
  const fields = parseRoleFields(formData);

  await withAuditLog(session, "update_admin_role", "admin_roles", async () => {
    const { data: before } = await supabase.from("admin_roles").select().eq("id", id).maybeSingle();
    const { data: after, error } = await supabase
      .from("admin_roles")
      .update(fields)
      .eq("id", id)
      .select()
      .single();
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before, after };
  });

  revalidatePath("/admin/users");
}

export async function deleteRole(id: string) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();

  await withAuditLog(session, "delete_admin_role", "admin_roles", async () => {
    const { data: before } = await supabase.from("admin_roles").select().eq("id", id).maybeSingle();
    const { error } = await supabase.from("admin_roles").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before };
  });

  revalidatePath("/admin/users");
}
