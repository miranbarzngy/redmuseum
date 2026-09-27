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

// Throttle windows — must match 0016_admin_login_throttle.sql and
// 0059_admin_login_failure_throttle.sql. Only used to tell the user how
// long to wait; the database functions are what actually enforce them.
const IP_COOLDOWN_MS = 60_000;
const PAIR_FAILURE_LIMIT = 5;
const PAIR_WINDOW_MS = 15 * 60_000;
const EMAIL_FAILURE_LIMIT = 100;
const EMAIL_WINDOW_MS = 60 * 60_000;

type AdminClient = ReturnType<typeof createAdminClient>;

/** When the per-IP one-attempt-a-minute cooldown ends, or null if unknown. */
async function ipRetryAt(supabase: AdminClient, ip: string): Promise<number | null> {
  const { data } = await supabase
    .from("admin_login_attempts")
    .select("last_attempt_at")
    .eq("ip", ip)
    .maybeSingle();
  return data ? Date.parse(data.last_attempt_at) + IP_COOLDOWN_MS : null;
}

/**
 * When enough of this email's failures age out of their windows for
 * admin_login_attempt() to let it through again, or null if unknown.
 * A limit of N in a window is lifted once the Nth-newest failure expires.
 */
async function emailRetryAt(supabase: AdminClient, email: string, ip: string): Promise<number | null> {
  const { data } = await supabase
    .from("admin_login_failures")
    .select("ip, attempted_at")
    .eq("email", email)
    .gt("attempted_at", new Date(Date.now() - EMAIL_WINDOW_MS).toISOString())
    .order("attempted_at", { ascending: false });
  if (!data) return null;

  const pairCutoff = Date.now() - PAIR_WINDOW_MS;
  const pairTimes = data
    .filter((row) => row.ip === ip)
    .map((row) => Date.parse(row.attempted_at))
    .filter((t) => t > pairCutoff);
  const retryTimes = [
    pairTimes.length >= PAIR_FAILURE_LIMIT ? pairTimes[PAIR_FAILURE_LIMIT - 1] + PAIR_WINDOW_MS : 0,
    data.length >= EMAIL_FAILURE_LIMIT
      ? Date.parse(data[EMAIL_FAILURE_LIMIT - 1].attempted_at) + EMAIL_WINDOW_MS
      : 0,
  ];
  const retryAt = Math.max(...retryTimes);
  return retryAt > 0 ? retryAt : null;
}

function redirectRateLimited(next: string, retryAt: number | null): never {
  const until = retryAt ? `&until=${Math.ceil(retryAt / 1000)}` : "";
  redirect(`/admin/login?error=2${until}&next=${encodeURIComponent(next)}`);
}

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
    redirectRateLimited(next, await ipRetryAt(supabase, ip));
  }

  if (email) {
    const { data: emailAllowed, error: emailError } = await supabase.rpc("admin_login_attempt", {
      p_email: email,
      p_ip: ip,
    });
    if (emailError) throw emailError;
    if (!emailAllowed) {
      redirectRateLimited(next, await emailRetryAt(supabase, email, ip));
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
