package com.amnaka.admin;

import android.content.Intent;
import android.content.pm.PackageInfo;
import android.net.Uri;
import android.os.Build;
import android.provider.Settings;

import androidx.core.content.FileProvider;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;

/**
 * Sideload self-updater for the Amna Suraka Admin shell.
 *
 * The web UI (the real admin panel, served from Vercel) never ships inside
 * the APK, so day-to-day changes need no update here. This plugin only
 * matters when the *native* shell changes — a new plugin, a manifest tweak,
 * an icon. It lets the Settings screen download a newer signed APK and hand
 * it to the system installer, so the user taps "Update" instead of
 * re-sideloading by hand.
 *
 * Registered in {@link MainActivity#onCreate}. JS side: src/lib/nativeAppUpdate.ts.
 */
@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private static final String FILE_PROVIDER_SUFFIX = ".fileprovider";
    private static final int MAX_REDIRECTS = 5;

    /** Installed versionCode / versionName / packageName, for the JS check. */
    @PluginMethod
    public void getInfo(PluginCall call) {
        try {
            PackageInfo info = getContext()
                .getPackageManager()
                .getPackageInfo(getContext().getPackageName(), 0);

            long versionCode = Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
                ? info.getLongVersionCode()
                : info.versionCode;

            JSObject ret = new JSObject();
            ret.put("versionCode", versionCode);
            ret.put("versionName", info.versionName);
            ret.put("packageName", getContext().getPackageName());
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Could not read package info: " + e.getMessage(), e);
        }
    }

    /**
     * Whether this app is currently allowed to install APKs (the per-app
     * "install unknown apps" toggle). Always true below Android 8, which had
     * no per-app control.
     */
    @PluginMethod
    public void canInstall(PluginCall call) {
        boolean granted = Build.VERSION.SDK_INT < Build.VERSION_CODES.O
            || getContext().getPackageManager().canRequestPackageInstalls();

        JSObject ret = new JSObject();
        ret.put("granted", granted);
        call.resolve(ret);
    }

    /** Opens the system screen where the user grants the toggle above. */
    @PluginMethod
    public void openInstallSettings(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            Intent intent = new Intent(Settings.ACTION_MANAGE_UNKNOWN_APP_SOURCES)
                .setData(Uri.parse("package:" + getContext().getPackageName()))
                .addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(intent);
        }
        call.resolve();
    }

    /**
     * Downloads the APK at {@code url} to app-private external storage,
     * emitting {@code downloadProgress} events, then fires the system install
     * intent. Resolves {@code { started: true }} once the installer is shown.
     */
    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        String url = call.getString("url");
        if (url == null || url.trim().isEmpty()) {
            call.reject("Missing 'url'");
            return;
        }
        final String downloadUrl = url.trim();
        new Thread(() -> runDownload(call, downloadUrl)).start();
    }

    private void runDownload(PluginCall call, String urlString) {
        HttpURLConnection connection = null;
        try {
            File base = getContext().getExternalFilesDir(null);
            if (base == null) {
                call.reject("External storage is not available");
                return;
            }
            File dir = new File(base, "updates");
            if (!dir.exists() && !dir.mkdirs()) {
                call.reject("Could not create the download folder");
                return;
            }
            File apkFile = new File(dir, "app-update.apk");
            if (apkFile.exists()) {
                //noinspection ResultOfMethodCallIgnored
                apkFile.delete();
            }

            // Follow redirects by hand — HttpURLConnection won't cross
            // http<->https, and CDN/storage links often bounce once.
            String current = urlString;
            int redirects = 0;
            while (true) {
                connection = (HttpURLConnection) new URL(current).openConnection();
                connection.setConnectTimeout(30000);
                connection.setReadTimeout(60000);
                connection.setInstanceFollowRedirects(false);
                connection.setRequestProperty(
                    "Accept",
                    "application/vnd.android.package-archive, application/octet-stream, */*"
                );

                int code = connection.getResponseCode();
                boolean isRedirect = code == HttpURLConnection.HTTP_MOVED_PERM
                    || code == HttpURLConnection.HTTP_MOVED_TEMP
                    || code == HttpURLConnection.HTTP_SEE_OTHER
                    || code == 307
                    || code == 308;

                if (isRedirect) {
                    String location = connection.getHeaderField("Location");
                    connection.disconnect();
                    if (location == null || ++redirects > MAX_REDIRECTS) {
                        call.reject("Too many redirects while downloading the update");
                        return;
                    }
                    current = new URL(new URL(current), location).toString();
                    continue;
                }
                if (code != HttpURLConnection.HTTP_OK) {
                    call.reject("Download failed (HTTP " + code + ")");
                    return;
                }
                break;
            }

            long total = connection.getContentLengthLong();
            long received = 0;
            long lastEmit = 0;
            byte[] buffer = new byte[16 * 1024];

            try (InputStream in = connection.getInputStream();
                 FileOutputStream out = new FileOutputStream(apkFile)) {
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                    received += read;

                    long now = System.currentTimeMillis();
                    if (now - lastEmit >= 150 || (total > 0 && received >= total)) {
                        lastEmit = now;
                        JSObject progress = new JSObject();
                        progress.put("receivedBytes", received);
                        progress.put("totalBytes", total);
                        progress.put(
                            "progress",
                            total > 0 ? Math.min(1.0, (double) received / (double) total) : 0.0
                        );
                        notifyListeners("downloadProgress", progress);
                    }
                }
                out.flush();
            }

            Uri apkUri = FileProvider.getUriForFile(
                getContext(),
                getContext().getPackageName() + FILE_PROVIDER_SUFFIX,
                apkFile
            );

            Intent install = new Intent(Intent.ACTION_VIEW);
            install.setDataAndType(apkUri, "application/vnd.android.package-archive");
            install.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(install);

            JSObject ret = new JSObject();
            ret.put("started", true);
            call.resolve(ret);
        } catch (Exception e) {
            call.reject("Update failed: " + e.getMessage(), e);
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }
}
