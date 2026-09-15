"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/clientIp";
import {
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSessionToken,
  verifyPassword,
} from "@/lib/adminAuth";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "/admin");
  const next = rawNext.startsWith("/admin") ? rawNext : "/admin";

  const { data: allowed, error } = await createClient().rpc("check_admin_login_attempt", {
    client_ip: await clientIp(),
  });
  if (error) throw error;
  if (!allowed) {
    redirect(`/admin/login?error=2&next=${encodeURIComponent(next)}`);
  }

  const supabase = createAdminClient();
  const { data: user } = await supabase
    .from("admin_users")
    .select("id, email, role_id, password_hash, is_active")
    .eq("email", email)
    .maybeSingle();

  // Same "?error=1" outcome whether the email doesn't exist, the account
  // is deactivated, or the password is wrong — never reveal which one.
  const valid = Boolean(user?.is_active) && (await verifyPassword(password, user?.password_hash ?? ""));
  if (!email || !password || !user || !valid) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  await supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", user.id);

  const token = await createSessionToken({ userId: user.id, email: user.email, roleId: user.role_id });
  (await cookies()).set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(next);
}
