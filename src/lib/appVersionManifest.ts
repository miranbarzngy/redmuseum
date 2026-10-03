import "server-only";

/**
 * Single source of truth for the admin app's release manifest — backs both
 * /api/app-version (polled by the installed Android APK's in-app updater)
 * and the Settings > "داگرتنی ئەپەکان" download links. All values come from
 * env vars so shipping a new APK/EXE needs no code change, just new vars.
 */
export interface AppVersionManifest {
  versionCode: number;
  versionName: string | null;
  apkUrl: string | null;
  /** Hex SHA-256 of the APK at apkUrl. The Android shell (1.5+) refuses to
   * install a download that doesn't match it, or a release without one. */
  apkSha256: string | null;
  notes: string | null;
  exeVersionName: string | null;
  exeUrl: string | null;
}

export function getAppVersionManifest(): AppVersionManifest {
  const versionCode = Number.parseInt(process.env.APP_LATEST_VERSION_CODE ?? "", 10);

  return {
    versionCode: Number.isFinite(versionCode) ? versionCode : 0,
    versionName: process.env.APP_LATEST_VERSION_NAME || null,
    apkUrl: process.env.APP_APK_URL || null,
    apkSha256: process.env.APP_APK_SHA256?.trim().toLowerCase() || null,
    notes: process.env.APP_UPDATE_NOTES || null,
    exeVersionName: process.env.APP_EXE_VERSION_NAME || null,
    exeUrl: process.env.APP_EXE_URL || null,
  };
}
