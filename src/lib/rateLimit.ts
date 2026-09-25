import "server-only";
import { NextResponse } from "next/server";
import { createAdminClient } from "./supabase/admin";
import { clientIp } from "./clientIp";

/** Per-endpoint limits for the public, unauthenticated API routes. Keyed on
 * IP, and mobile carriers put many subscribers behind one shared IP
 * (carrier-grade NAT), so these are sized for a crowd of real visitors on
 * one address rather than for one person — still low enough that
 * scripting them can't flood the admin inbox, push notifications or
 * storage. */
export const RATE_LIMITS = {
  booking: { limit: 20, windowSeconds: 60 * 60 },
  contact: { limit: 20, windowSeconds: 60 * 60 },
  faceUpload: { limit: 40, windowSeconds: 60 * 60 },
  trackVisit: { limit: 300, windowSeconds: 60 },
} as const;

/**
 * Counts one hit against `bucket` for the caller's IP (check_rate_limit,
 * 0060_rate_limits.sql) and returns whether it's still within the limit.
 * Fails open: if the check itself errors, the request is allowed and the
 * error logged — a limiter outage shouldn't take the booking form down.
 */
export async function withinRateLimit(bucket: keyof typeof RATE_LIMITS): Promise<boolean> {
  const { limit, windowSeconds } = RATE_LIMITS[bucket];
  const { data, error } = await createAdminClient().rpc("check_rate_limit", {
    p_bucket: bucket,
    p_key: await clientIp(),
    p_limit: limit,
    p_window_seconds: windowSeconds,
  });
  if (error) {
    console.error(`[rateLimit] ${bucket} check failed`, error.message);
    return true;
  }
  return data === true;
}

export function rateLimitedResponse() {
  return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
}
