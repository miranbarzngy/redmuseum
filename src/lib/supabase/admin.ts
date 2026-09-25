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
 * There's no per-user Supabase Auth session in this app — admin identity is
 * its own admin_users/admin_roles tables plus a JWT session cookie (see
 * src/lib/adminAuth.ts), not a Supabase Auth user, so RLS's `is_admin()` /
 * `auth.uid()` checks have nothing to authenticate against for writes. This
 * client is how the already-session-gated Server Actions actually perform
 * those writes.
 *
 * Only these kinds of call sites are allowed to import this:
 *   1. src/app/admin/**\/actions.ts — gated by requireAdminSession() (an
 *      admin's signed JWT session cookie, re-verified against admin_users
 *      and admin_sessions on every call).
 *   2. Webhook / cron routes (api/notify-admin, api/booking/reminders,
 *      api/booking/cleanup-photos) — gated instead by a shared secret
 *      (src/lib/webhookAuth.ts), since they're called server-to-server.
 *   3. Server Components rendered under src/app/admin/(dashboard)/** —
 *      that route group's own layout re-checks getAdminSession() directly
 *      (see (dashboard)/layout.tsx), the same guarantee gated Server
 *      Actions have, so reads of admin-only data (e.g. visitor analytics)
 *      there are equally safe.
 *   4. The public API routes (api/booking, api/contact, api/booking/lookup,
 *      api/reserve/upload-face, api/track-visit), the login action and
 *      src/lib/rateLimit.ts — unauthenticated by nature, so each one writes
 *      only fixed, validated fields behind a rate limit and never returns
 *      anything beyond what it was built to expose. The anon key has no
 *      write access at all (0063_lock_down_anon_writes.sql), which is what
 *      makes these routes the only way in.
 *   5. The public QR status page (src/app/[locale]/booking/[token]) — reads
 *      one booking by its unguessable public_token.
 * Never let SUPABASE_SECRET_KEY reach the browser.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(supabaseUrl(), secretKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
