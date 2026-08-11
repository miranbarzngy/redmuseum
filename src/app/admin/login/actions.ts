"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { clientIp } from "@/lib/clientIp";
import { ADMIN_COOKIE_NAME, SESSION_MAX_AGE_SECONDS, createSessionCookieValue, verifyPassword } from "@/lib/adminAuth";

export async function signIn(formData: FormData) {
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

  if (!password || !verifyPassword(password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }

  (await cookies()).set(ADMIN_COOKIE_NAME, await createSessionCookieValue(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });

  redirect(next);
}
