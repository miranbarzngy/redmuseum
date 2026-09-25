"use server";

import { revalidatePath } from "next/cache";
import { requireAdminSession, hashPassword, revokeUserSessions, type AdminSession } from "@/lib/adminAuth";
import { withAuditLog } from "@/lib/auditLogger";
import { PERMISSIONS, canGrant, isKnownPermission } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

const USER_COLUMNS = "id, full_name, email, role_id, is_active, created_at";

const NOT_ALLOWED = "ڕێگەت پێنەدراوە بۆ ئەم کردارە.";

type AdminClient = ReturnType<typeof createAdminClient>;

// Privilege boundary for everything below: users:manage lets its holder
// manage only users and roles whose permissions are a subset of their own
// (see canGrant). Without it, a users:manage-only admin could create a "*"
// role, move themselves into it, or reset the Super Admin's password — the
// UI hides those options, but Server Actions are directly invokable.

async function rolePermissions(supabase: AdminClient, roleId: string): Promise<string[]> {
  const { data } = await supabase.from("admin_roles").select("permissions").eq("id", roleId).maybeSingle();
  if (!data) throw new Error("ڕۆڵەکە نەدۆزرایەوە.");
  return data.permissions;
}

async function userRoleId(supabase: AdminClient, userId: string): Promise<string> {
  const { data } = await supabase.from("admin_users").select("role_id").eq("id", userId).maybeSingle();
  if (!data) throw new Error("بەکارهێنەرەکە نەدۆزرایەوە.");
  return data.role_id;
}

function assertCanGrant(session: AdminSession, permissions: string[]) {
  if (!canGrant(session.role.permissions, permissions)) throw new Error(NOT_ALLOWED);
}

/** The target user's current role must be within the caller's own reach. */
async function assertCanManageUser(supabase: AdminClient, session: AdminSession, userId: string) {
  assertCanGrant(session, await rolePermissions(supabase, await userRoleId(supabase, userId)));
}

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
  assertCanGrant(session, await rolePermissions(supabase, fields.role_id));

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

  const currentRoleId = await userRoleId(supabase, id);
  if (id === session.id && fields.role_id !== currentRoleId) {
    throw new Error("ناتوانیت ڕۆڵی خۆت بگۆڕیت.");
  }
  assertCanGrant(session, await rolePermissions(supabase, currentRoleId));
  assertCanGrant(session, await rolePermissions(supabase, fields.role_id));

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

  // A changed password signs that user out everywhere — including any
  // session held by whoever knew the old one.
  if (password) await revokeUserSessions(id);

  revalidatePath("/admin/users");
}

/** A separate, minimal action from updateUser — the "quick reset" affordance
 * on each user card. Deliberately never logs the password itself (hashed or
 * not) into admin_audit_logs.details — only that a reset happened. */
export async function resetUserPassword(id: string, formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();
  const password = parsePassword(formData, true);
  await assertCanManageUser(supabase, session, id);

  await withAuditLog(session, "reset_admin_user_password", "admin_users", async () => {
    const password_hash = await hashPassword(password!);
    const { error } = await supabase.from("admin_users").update({ password_hash }).eq("id", id);
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id };
  });

  await revokeUserSessions(id);
}

export async function setUserActive(id: string, isActive: boolean) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  if (id === session.id) {
    throw new Error("ناتوانیت هەژماری خۆت ناچالاک بکەیت.");
  }
  const supabase = createAdminClient();
  await assertCanManageUser(supabase, session, id);

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

  if (!isActive) await revokeUserSessions(id);

  revalidatePath("/admin/users");
}

/** Only real permission keys are accepted — never "*" or an arbitrary
 * string. The Super Admin "*" role is seeded by migration and immutable. */
function parseRoleFields(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) throw new Error("تکایە ناوی ڕۆڵ بنووسە.");
  const permissions = [...new Set(formData.getAll("permissions").map(String))].filter(isKnownPermission);
  return { name, permissions };
}

async function assertMutableRole(supabase: AdminClient, session: AdminSession, id: string) {
  const current = await rolePermissions(supabase, id);
  if (current.includes("*")) throw new Error("ڕۆڵی سوپەر ئەدمین ناتوانرێت بگۆڕدرێت.");
  assertCanGrant(session, current);
}

export async function createRole(formData: FormData) {
  const session = await requireAdminSession(PERMISSIONS.usersManage);
  const supabase = createAdminClient();
  const fields = parseRoleFields(formData);
  assertCanGrant(session, fields.permissions);

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
  await assertMutableRole(supabase, session, id);
  assertCanGrant(session, fields.permissions);

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
  await assertMutableRole(supabase, session, id);

  await withAuditLog(session, "delete_admin_role", "admin_roles", async () => {
    const { data: before } = await supabase.from("admin_roles").select().eq("id", id).maybeSingle();
    const { error } = await supabase.from("admin_roles").delete().eq("id", id);
    if (error) throw new Error(error.message);
    return { result: undefined, targetId: id, before };
  });

  revalidatePath("/admin/users");
}
