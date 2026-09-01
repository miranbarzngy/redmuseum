import type { CapacitorConfig } from "@capacitor/cli";

// This app is NOT bundled as a static export inside the APK — the admin
// panel runs on Server Actions, server-side Supabase queries, and
// cookie-based session auth (requireAdminSession() on every render), none
// of which exist in a static `next export`/`output: "export"` build.
// Instead, Capacitor's native WebView is pointed at the real, deployed
// Next.js server — the APK is a thin native shell (icon, splash screen,
// native plugins like push notifications) around the live admin panel,
// not an offline bundle of it.
//
// Update this if/when a custom domain replaces the vercel.app one — it's the
// only place that needs to change (then run `npm run cap:sync`).
const PRODUCTION_ADMIN_URL = "https://redmuseum.vercel.app/admin";

const config: CapacitorConfig = {
  appId: "com.amnaka.admin",
  appName: "Amna Suraka Admin",
  // No webDir build output is shipped inside the APK for the same reason —
  // Capacitor still requires this key to exist, but with server.url set,
  // it's only ever used as a fallback if the remote URL can't be reached.
  webDir: "public",
  server: {
    url: PRODUCTION_ADMIN_URL,
    cleartext: false,
  },
  android: {
    // Keep the native WebView's own back button behavior in sync with
    // the app's actual navigation rather than immediately exiting.
    allowMixedContent: false,
  },
};

export default config;
