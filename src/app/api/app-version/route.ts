import { NextResponse } from "next/server";
import { getAppVersionManifest } from "@/lib/appVersionManifest";

// Never cache — the native app polls this to decide whether to offer an
// update, and a stale CDN copy would keep hiding a release.
export const dynamic = "force-dynamic";

/**
 * Latest-release manifest for the admin app: the Android shell's in-app
 * updater polls this, and Settings > "داگرتنی ئەپەکان" reads it (via
 * getAppVersionManifest() directly, no self-fetch) for its download links.
 *
 * All values come from environment variables so shipping a new APK/EXE
 * needs no code change and no DB migration — just bump the vars and
 * redeploy. See getAppVersionManifest() for the exact var names.
 *
 * With a URL var unset, that platform's panel/link just says "not
 * published yet" — it never nags.
 */
export function GET() {
  return NextResponse.json(getAppVersionManifest());
}
