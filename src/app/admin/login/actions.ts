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

  // Two independent throttles: per-IP (0016) and per-email (0043). The IP
  // one is keyed on a client-influenceable header (see clientIp.ts) and can
  // be bypassed by spoofing a fresh value on every request; the per-email
  // one can't be dodged that way since the attacker can't change which
  // account they're guessing. Both must allow the attempt.
  const throttleClient = createClient();
  const { data: ipAllowed, error: ipError } = await throttleClient.rpc("check_admin_login_attempt", {
    client_ip: await clientIp(),
  });
  if (ipError) throw ipError;
  if (!ipAllowed) {
    redirect(`/admin/login?error=2&next=${encodeURIComponent(next)}`);
  }

  if (email) {
    const { data: emailAllowed, error: emailError } = await throttleClient.rpc(
      "check_admin_login_attempt_by_email",
      { p_email: email }
    );
    if (emailError) throw emailError;
    if (!emailAllowed) {
      redirect(`/admin/login?error=2&next=${encodeURIComponent(next)}`);
    }
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
