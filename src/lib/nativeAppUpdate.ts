"use client";

import { registerPlugin, type PluginListenerHandle } from "@capacitor/core";

/**
 * Bridge to the native ApkUpdaterPlugin (android/app/src/main/java/com/amnaka/
 * admin/ApkUpdaterPlugin.java). Only real inside the installed APK — in a
 * browser every method rejects with "not implemented", so callers must gate
 * on `useIsNativeApp()` first.
 */
export interface ApkUpdaterPlugin {
  /** Currently-installed shell version. */
  getInfo(): Promise<{ versionCode: number; versionName: string; packageName: string }>;
  /** Whether "install unknown apps" is granted for this app. */
  canInstall(): Promise<{ granted: boolean }>;
  /** Opens the system screen to grant the toggle above. */
  openInstallSettings(): Promise<void>;
  /** Downloads `url` then shows the system installer. */
  downloadAndInstall(options: { url: string }): Promise<{ started: boolean }>;
  addListener(
    eventName: "downloadProgress",
    listenerFunc: (data: {
      progress: number;
      receivedBytes: number;
      totalBytes: number;
    }) => void,
  ): Promise<PluginListenerHandle>;
}

export const ApkUpdater = registerPlugin<ApkUpdaterPlugin>("ApkUpdater");

export interface AppVersionManifest {
  versionCode: number;
  versionName: string | null;
  apkUrl: string | null;
  notes: string | null;
}

export type AppUpdateCheck =
  | {
      state: "available";
      installedVersionName: string;
      latest: AppVersionManifest & { apkUrl: string };
    }
  | { state: "current"; installedVersionName: string }
  | { state: "not-configured" }
  | { state: "error"; message: string };

/**
 * Asks the native side for the installed versionCode, fetches
 * /api/app-version, and reports whether a newer APK is on offer.
 */
export async function checkForAppUpdate(): Promise<AppUpdateCheck> {
  try {
    const installed = await ApkUpdater.getInfo();

    const res = await fetch("/api/app-version", { cache: "no-store" });
    if (!res.ok) return { state: "error", message: `HTTP ${res.status}` };
    const latest = (await res.json()) as AppVersionManifest;

    if (!latest.apkUrl || !latest.versionCode) return { state: "not-configured" };

    if (latest.versionCode > installed.versionCode) {
      return {
        state: "available",
        installedVersionName: installed.versionName,
        latest: { ...latest, apkUrl: latest.apkUrl },
      };
    }
    return { state: "current", installedVersionName: installed.versionName };
  } catch (err) {
    return { state: "error", message: err instanceof Error ? err.message : String(err) };
  }
}
