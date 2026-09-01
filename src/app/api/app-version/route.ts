import { NextResponse } from "next/server";

// Never cache — the native app polls this to decide whether to offer an
// update, and a stale CDN copy would keep hiding a release.
export const dynamic = "force-dynamic";

/**
 * Latest-APK manifest for the Android admin shell's in-app updater.
 *
 * All four values come from environment variables so shipping a new APK
 * needs no code change and no DB migration — just bump the vars and
 * redeploy:
 *
 *   APP_LATEST_VERSION_CODE  integer, must match android/app/build.gradle's
 *                            versionCode of the uploaded APK
 *   APP_LATEST_VERSION_NAME  human label, e.g. "1.2"
 *   APP_APK_URL              public https URL of the signed release APK
 *   APP_UPDATE_NOTES         optional one-line "what's new"
 *
 * With APP_LATEST_VERSION_CODE / APP_APK_URL unset the Settings panel just
 * shows "no update configured" — it never nags.
 */
export function GET() {
  const versionCode = Number.parseInt(process.env.APP_LATEST_VERSION_CODE ?? "", 10);

  return NextResponse.json({
    versionCode: Number.isFinite(versionCode) ? versionCode : 0,
    versionName: process.env.APP_LATEST_VERSION_NAME || null,
    apkUrl: process.env.APP_APK_URL || null,
    notes: process.env.APP_UPDATE_NOTES || null,
  });
}
