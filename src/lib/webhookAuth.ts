import "server-only";
import { createHash, timingSafeEqual } from "node:crypto";

/** Constant-time string comparison. Both sides are hashed first so
 * timingSafeEqual always gets equal-length buffers and the comparison time
 * leaks nothing about the secret's contents or length. An unset/empty
 * secret never matches anything. */
function secretMatches(candidate: string | null, secret: string | undefined): boolean {
  if (!candidate || !secret) return false;
  const a = createHash("sha256").update(candidate).digest();
  const b = createHash("sha256").update(secret).digest();
  return timingSafeEqual(a, b);
}

/** The x-webhook-secret header the Supabase DB triggers / pg_cron jobs send
 * (must equal WEBHOOK_SECRET). */
export function hasWebhookSecret(request: Request): boolean {
  return secretMatches(request.headers.get("x-webhook-secret"), process.env.WEBHOOK_SECRET);
}

/** For scheduled jobs: the webhook secret (Supabase pg_cron) OR the
 * `Authorization: Bearer <CRON_SECRET>` Vercel Cron sends when CRON_SECRET
 * is set. */
export function isAuthorizedCron(request: Request): boolean {
  if (hasWebhookSecret(request)) return true;
  const auth = request.headers.get("authorization");
  const bearer = auth?.startsWith("Bearer ") ? auth.slice("Bearer ".length) : null;
  return secretMatches(bearer, process.env.CRON_SECRET);
}
