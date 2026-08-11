import "server-only";
import { cookies } from "next/headers";

// Uses Web Crypto (globalThis.crypto.subtle) rather than node:crypto so the
// same code works in both the Edge middleware runtime and Server Actions.

export const ADMIN_COOKIE_NAME = "admin_session";
export const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getPassword(): string {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    throw new Error(
      "Missing ADMIN_PASSWORD. Set it in .env.local (server-only — no NEXT_PUBLIC_ prefix) and restart the server."
    );
  }
  return password;
}

async function getHmacKey(): Promise<CryptoKey> {
  const keyData = new TextEncoder().encode(getPassword());
  return crypto.subtle.importKey("raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, [
    "sign",
    "verify",
  ]);
}

function toHex(buffer: ArrayBuffer): string {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string): Uint8Array {
  const bytes = hex.match(/.{1,2}/g);
  if (!bytes) return new Uint8Array();
  return new Uint8Array(bytes.map((b) => parseInt(b, 16)));
}

/** Signed, expiring session token — stateless, no session store required. */
export async function createSessionCookieValue(): Promise<string> {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = `admin.${expires}`;
  const key = await getHmacKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return `${payload}.${toHex(signature)}`;
}

export async function isValidSessionCookie(value: string | undefined | null): Promise<boolean> {
  if (!value) return false;

  const lastDot = value.lastIndexOf(".");
  if (lastDot === -1) return false;

  const payload = value.slice(0, lastDot);
  const signatureHex = value.slice(lastDot + 1);
  const [scope, expiresStr] = payload.split(".");

  if (scope !== "admin") return false;

  const expires = Number(expiresStr);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;

  try {
    const key = await getHmacKey();
    return await crypto.subtle.verify(
      "HMAC",
      key,
      fromHex(signatureHex) as BufferSource,
      new TextEncoder().encode(payload)
    );
  } catch {
    return false;
  }
}

/**
 * Guards every admin Server Action directly. Middleware and the dashboard
 * layout already gate page navigation, but Server Actions are independently
 * invokable endpoints — and these particular ones run through the
 * service-role Supabase client (src/lib/supabase/admin.ts), which bypasses
 * RLS entirely. Without this check, a request that skips the UI would hit
 * an unauthenticated write with zero database-level protection.
 */
export async function requireAdminSession(): Promise<void> {
  const authed = await isValidSessionCookie((await cookies()).get(ADMIN_COOKIE_NAME)?.value);
  if (!authed) {
    throw new Error("Not authenticated.");
  }
}

/** Length-independent-ish comparison — adequate for a single shared secret on a low-traffic internal tool. */
export function verifyPassword(candidate: string): boolean {
  const password = getPassword();
  if (candidate.length !== password.length) return false;

  let diff = 0;
  for (let i = 0; i < password.length; i++) {
    diff |= candidate.charCodeAt(i) ^ password.charCodeAt(i);
  }
  return diff === 0;
}
