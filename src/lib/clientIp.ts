import "server-only";
import { headers } from "next/headers";

/** Best-effort client IP from the incoming request — Vercel's edge network sets x-forwarded-for. */
export async function clientIp(): Promise<string> {
  const forwardedFor = (await headers()).get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}
