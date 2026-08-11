import "server-only";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";
import { supabaseAnonKey, supabaseUrl } from "./env";

/**
 * Public, anon-key Supabase client for reads (site content + admin list/edit
 * pages) — RLS's public SELECT policies apply. There's no Supabase Auth
 * session anywhere in this app (admin access is a single shared password,
 * see src/lib/adminAuth.ts), so this needs no cookie plumbing; it's a plain
 * client, safe to construct fresh per request.
 */
export function createClient() {
  return createSupabaseClient<Database>(supabaseUrl(), supabaseAnonKey(), {
    auth: { persistSession: false },
  });
}
