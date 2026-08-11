import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseUrl } from "./env";

function secretKey(): string {
  const key = process.env.SUPABASE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "Missing SUPABASE_SECRET_KEY. Set it in .env.local (server-only — no NEXT_PUBLIC_ prefix) and restart the server."
    );
  }
  return key;
}

/**
 * Full-privilege Supabase client (bypasses Row Level Security entirely).
 *
 * There's no per-user Supabase Auth session in this app — admin access is
 * gated by a single shared password (see src/lib/adminAuth.ts), not by a
 * Supabase user identity, so RLS's `is_admin()` / `auth.uid()` checks have
 * nothing to authenticate against for writes. This client is how the
 * already-password-gated Server Actions actually perform those writes.
 *
 * Only three kinds of call sites are allowed to import this:
 *   1. src/app/admin/**\/actions.ts — gated by requireAdminSession() (an
 *      admin's signed cookie).
 *   2. src/app/api/notify-admin/route.ts — gated instead by a shared
 *      x-webhook-secret header, since it's called server-to-server by a
 *      Supabase DB trigger (no browser session exists to check there).
 *   3. Server Components rendered under src/app/admin/(dashboard)/** —
 *      that route group's own layout re-checks isValidSessionCookie()
 *      directly (see (dashboard)/layout.tsx), the same guarantee gated
 *      Server Actions have, so reads of admin-only data (e.g. visitor
 *      analytics) there are equally safe.
 * All three gates exist specifically so this client is never reachable from
 * an unauthenticated request. Never let SUPABASE_SECRET_KEY reach the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
