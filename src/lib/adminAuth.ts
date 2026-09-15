import "server-only";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { createAdminClient } from "./supabase/admin";
import { hasPermission } from "./permissions";
import type { AdminRoleRow, AdminUserRow } from "./supabase/database.types";

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getJwtSecret(): Uint8Array {
  const secret = process.env.ADMIN_JWT_SECRET;
  if (!secret) {
    throw new Error(
      "Missing ADMIN_JWT_SECRET. Set it in .env.local (server-only — no NEXT_PUBLIC_ prefix) and restart the server."
    );
  }
  return new TextEncoder().encode(secret);
}

type SessionClaims = { userId: string; email: string; roleId: string };

export type AdminSession = {
  id: string;
  email: string;
  fullName: string;
  role: { id: string; name: string; permissions: string[] };
};

// database.types.ts is hand-written with no Relationships metadata, so the
// joined select's shape is described locally (same pattern as gallery's
// GalleryRowWithCategory in gallery/page.tsx) — PostgREST still returns a
// single object here, not an array, because admin_users.role_id really is
// a to-one FK against admin_roles (see 0041_admin_rbac_and_audit_log.sql).
type AdminUserWithRole = AdminUserRow & { role: AdminRoleRow | null };

/** Signed, expiring session token — stateless, no session store required.
 * Uses Web Crypto (via jose) rather than node:crypto so the same code works
 * in both the Edge proxy.ts runtime and Node Server Actions. */
export async function createSessionToken(claims: SessionClaims): Promise<string> {
  return new SignJWT(claims)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + SESSION_MAX_AGE_SECONDS)
    .sign(getJwtSecret());
}

async function decodeSessionToken(
  token: string | undefined | null
): Promise<SessionClaims | null> {
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getJwtSecret());
    if (
      typeof payload.userId !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.roleId !== "string"
    ) {
      return null;
    }
    return { userId: payload.userId, email: payload.email, roleId: payload.roleId };
  } catch {
    return null;
  }
}

/**
 * Cheap, DB-free check: signature + expiry only. This is what proxy.ts
 * (Edge middleware) calls to gate page navigation — it only needs "is this
 * a structurally valid, unexpired session" to decide whether to redirect to
 * /admin/login, not up-to-the-second permission data, so it never touches
 * the database.
 */
export async function isValidSessionToken(token: string | undefined | null): Promise<boolean> {
  return (await decodeSessionToken(token)) !== null;
}

/**
 * Authoritative session lookup: verifies the token, then re-fetches the
 * user + role fresh from the database rather than trusting the JWT's
 * claims beyond "which user is this". Fresh-fetching means deactivating a
 * user or editing a role's permissions takes effect on their very next
 * action, not at token expiry. Returns null (rather than throwing) so
 * Server Components can redirect instead of erroring.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const claims = await decodeSessionToken((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
  if (!claims) return null;

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("admin_users")
    .select("id, email, full_name, is_active, role:admin_roles(id, name, permissions)")
    .eq("id", claims.userId)
    .maybeSingle();

  const user = data as AdminUserWithRole | null;
  if (error || !user || !user.is_active || !user.role) return null;

  return {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    role: { id: user.role.id, name: user.role.name, permissions: user.role.permissions },
  };
}

/**
 * Guards every admin Server Action / dashboard Server Component directly.
 * proxy.ts already gates page navigation with the cheap check above, but
 * Server Actions are independently invokable endpoints — and these
 * particular ones run through the service-role Supabase client
 * (src/lib/supabase/admin.ts), which bypasses RLS entirely. Without this
 * check, a request that skips the UI would hit an unauthenticated write
 * with zero database-level protection. Pass a permission string (see
 * src/lib/permissions.ts) to also require the session's role to hold it.
 */
export async function requireAdminSession(requiredPermission?: string): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) {
    throw new Error("Not authenticated.");
  }
  if (requiredPermission && !hasPermission(session.role.permissions, requiredPermission)) {
    throw new Error("ڕێگەت پێنەدراوە بۆ ئەم کردارە.");
  }
  return session;
}

export async function hashPassword(password: string): Promise<string> {
  const rounds = Number(process.env.BCRYPT_SALT_ROUNDS ?? 12);
  return bcrypt.hash(password, rounds);
}

/** Compares a candidate password against a stored bcrypt hash — including
 * hashes produced by Postgres's pgcrypto crypt(password, gen_salt('bf')),
 * used for the one-off bootstrap admin account (see the migration). */
export async function verifyPassword(candidate: string, hash: string): Promise<boolean> {
  return bcrypt.compare(candidate, hash);
}
