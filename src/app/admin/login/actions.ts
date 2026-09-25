"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/clientIp";
import {
  ADMIN_COOKIE_NAME,
  SESSION_MAX_AGE_SECONDS,
  createSession,
  verifyPassword,
} from "@/lib/adminAuth";

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const password = String(formData.get("password") ?? "");
  const rawNext = String(formData.get("next") ?? "/admin");
  const next = rawNext.startsWith("/admin") ? rawNext : "/admin";

  // Two independent throttles, both called through the service-role client
  // (neither function is executable with the public anon key):
  //   - per-IP cooldown (0016): at most one attempt a minute from one IP;
  //   - per-(email, IP) failure count (0059): 5 wrong passwords in 15
  //     minutes blocks that pair, 100 in an hour blocks the email outright.
  //     Only failures count, so someone hammering an admin's email from
  //     their own IP can't lock the real admin out of theirs.
  const supabase = createAdminClient();
  const ip = await clientIp();
  const { data: ipAllowed, error: ipError } = await supabase.rpc("check_admin_login_attempt", {
    client_ip: ip,
  });
  if (ipError) throw ipError;
  if (!ipAllowed) {
    redirect(`/admin/login?error=2&next=${encodeURIComponent(next)}`);
  }

  if (email) {
    const { data: emailAllowed, error: emailError } = await supabase.rpc("admin_login_attempt", {
      p_email: email,
      p_ip: ip,
    });
    if (emailError) throw emailError;
    if (!emailAllowed) {
      redirect(`/admin/login?error=2&next=${encodeURIComponent(next)}`);
    }
  }

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

  await Promise.all([
    supabase.rpc("admin_login_succeeded", { p_email: email, p_ip: ip }),
    supabase.from("admin_users").update({ last_login: new Date().toISOString() }).eq("id", user.id),
  ]);

  const token = await createSession(user);
  (await cookies()).set(ADMIN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(next);
}
