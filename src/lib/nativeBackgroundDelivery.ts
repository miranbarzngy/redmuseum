"use client";

import { registerPlugin } from "@capacitor/core";

/**
 * Bridge to the native BackgroundDeliveryPlugin (android/app/src/main/java/
 * com/amnaka/admin/BackgroundDeliveryPlugin.java). Only exists in APK
 * versionCode 4+ — older shells and browsers reject every call, so callers
 * must gate on `useIsNativeApp()` and treat a rejection as "update the app".
 */
export interface BackgroundDeliveryPlugin {
  getStatus(): Promise<{
    ignoringBatteryOptimizations: boolean;
    notificationsEnabled: boolean;
    manufacturer: string;
    /** A vendor autostart / protected-apps screen was found on this device. */
    hasAutostartScreen: boolean;
  }>;
  /** System "let app always run in background?" dialog. */
  requestIgnoreBatteryOptimizations(): Promise<void>;
  /** Vendor autostart screen, falling back to the app's system settings. */
  openAutostartSettings(): Promise<void>;
  openNotificationSettings(): Promise<void>;
}

export const BackgroundDelivery = registerPlugin<BackgroundDeliveryPlugin>("BackgroundDelivery");
