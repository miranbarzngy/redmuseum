import { headers } from "next/headers";
import { createHmac } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { clientIp } from "@/lib/clientIp";

// Best-effort visitor beacon fired by src/components/VisitTracker.tsx on
// every public-site page view (including client-side route changes, which
// never re-run the Next.js proxy/middleware). Never allowed to affect the
// actual page — always resolves 204, errors are logged server-side only.

function hashIp(ip: string): string | null {
  const salt = process.env.ANALYTICS_IP_SALT;
  if (!salt) return null;
  return createHmac("sha256", salt).update(ip).digest("hex");
}

function decodeGeoHeader(value: string | null): string | null {
  if (!value) return null;
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => null);
    const path = typeof body?.path === "string" ? body.path.slice(0, 500) : null;
    if (!path) {
      return new NextResponse(null, { status: 204 });
    }

    const requestHeaders = await headers();
    const country = decodeGeoHeader(requestHeaders.get("x-vercel-ip-country"));
    const city = decodeGeoHeader(requestHeaders.get("x-vercel-ip-city"));
    const ipHash = hashIp(await clientIp());

    const { error } = await createClient().rpc("record_page_visit", {
      p_path: path,
      p_country: country,
      p_city: city,
      p_ip_hash: ipHash,
    });
    if (error) {
      console.error("[track-visit] record_page_visit failed", error);
    }
  } catch (err) {
    console.error("[track-visit] unexpected error", err);
  }

  return new NextResponse(null, { status: 204 });
}
