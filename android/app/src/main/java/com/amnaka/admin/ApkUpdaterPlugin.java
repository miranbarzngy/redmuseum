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

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.Locale;
import java.util.regex.Pattern;

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
 * What gets installed is never taken from JavaScript: the bridge is open to
 * every page the WebView loads, so a script injected into any of them could
 * otherwise hand the installer an APK of its choosing. Instead this reads
 * the release manifest itself from the app's own origin (server.url in
 * capacitor.config.ts) and installs only the APK it names — over HTTPS, from
 * Vercel Blob, and only if the download's SHA-256 matches the manifest's.
 *
 * Registered in {@link MainActivity#onCreate}. JS side: src/lib/nativeAppUpdate.ts.
 */
@CapacitorPlugin(name = "ApkUpdater")
public class ApkUpdaterPlugin extends Plugin {

    private static final String FILE_PROVIDER_SUFFIX = ".fileprovider";
    private static final int MAX_REDIRECTS = 5;
    /** Served by src/app/api/app-version/route.ts. */
    private static final String MANIFEST_PATH = "/api/app-version";
    /** Public Vercel Blob stores — where scripts/upload-app-release.mjs puts the APK. */
    private static final String DOWNLOAD_HOST_SUFFIX = ".public.blob.vercel-storage.com";
    private static final Pattern SHA256_HEX = Pattern.compile("^[0-9a-fA-F]{64}$");
    private static final int MAX_MANIFEST_BYTES = 64 * 1024;

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
     * Reads the release manifest from this app's own origin, downloads the
     * APK it names to app-private external storage (emitting
     * {@code downloadProgress} events), checks it against the manifest's
     * SHA-256, then fires the system install intent. Resolves
     * {@code { started: true }} once the installer is shown.
     *
     * A {@code url} passed by the caller is ignored — shells up to 1.4
     * downloaded it as given, which is the only reason the web side still
     * sends it.
     */
    @PluginMethod
    public void downloadAndInstall(PluginCall call) {
        new Thread(() -> runUpdate(call)).start();
    }

    private void runUpdate(PluginCall call) {
        try {
            Release release = fetchRelease();
            if (release.versionCode <= installedVersionCode()) {
                call.reject("No newer version is on offer");
                return;
            }

            File apkFile = downloadVerified(release);

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
        }
    }

    /** The latest release, as /api/app-version describes it. */
    private static final class Release {
        final long versionCode;
        final URL apkUrl;
        /** Lowercase hex. */
        final String sha256;

        Release(long versionCode, URL apkUrl, String sha256) {
            this.versionCode = versionCode;
            this.apkUrl = apkUrl;
            this.sha256 = sha256;
        }
    }

    private Release fetchRelease() throws Exception {
        String serverUrl = getBridge().getServerUrl();
        if (serverUrl == null) {
            throw new IOException("No server URL is configured");
        }
        URL manifestUrl = new URL(new URL(serverUrl), MANIFEST_PATH);
        if (!"https".equals(manifestUrl.getProtocol())) {
            throw new IOException("The release manifest must be served over HTTPS");
        }

        HttpURLConnection connection = (HttpURLConnection) manifestUrl.openConnection();
        try {
            connection.setConnectTimeout(30000);
            connection.setReadTimeout(30000);
            connection.setInstanceFollowRedirects(false);
            connection.setUseCaches(false);
            connection.setRequestProperty("Accept", "application/json");

            int code = connection.getResponseCode();
            if (code != HttpURLConnection.HTTP_OK) {
                throw new IOException("Release manifest unavailable (HTTP " + code + ")");
            }

            JSONObject manifest = new JSONObject(readLimited(connection.getInputStream(), MAX_MANIFEST_BYTES));
            String apkUrl = manifest.isNull("apkUrl") ? null : manifest.getString("apkUrl");
            String sha256 = manifest.isNull("apkSha256") ? null : manifest.getString("apkSha256");
            if (apkUrl == null) {
                throw new IOException("No release is published");
            }
            if (sha256 == null || !SHA256_HEX.matcher(sha256).matches()) {
                throw new IOException("The release has no valid SHA-256 checksum");
            }
            URL url = new URL(apkUrl);
            if (!isAllowedDownload(url)) {
                throw new IOException("The release is not on an allowed download host");
            }
            return new Release(manifest.optLong("versionCode", 0), url, sha256.toLowerCase(Locale.ROOT));
        } finally {
            connection.disconnect();
        }
    }

    /** HTTPS on a public Vercel Blob store — required of the manifest's APK
     * URL and of every redirect on the way to it. */
    private static boolean isAllowedDownload(URL url) {
        String host = url.getHost();
        return "https".equals(url.getProtocol())
            && host != null
            && host.toLowerCase(Locale.ROOT).endsWith(DOWNLOAD_HOST_SUFFIX);
    }

    private long installedVersionCode() throws Exception {
        PackageInfo info = getContext()
            .getPackageManager()
            .getPackageInfo(getContext().getPackageName(), 0);
        return Build.VERSION.SDK_INT >= Build.VERSION_CODES.P
            ? info.getLongVersionCode()
            : info.versionCode;
    }

    private File downloadVerified(Release release) throws Exception {
        File base = getContext().getExternalFilesDir(null);
        if (base == null) {
            throw new IOException("External storage is not available");
        }
        File dir = new File(base, "updates");
        if (!dir.exists() && !dir.mkdirs()) {
            throw new IOException("Could not create the download folder");
        }
        File apkFile = new File(dir, "app-update.apk");
        if (apkFile.exists()) {
            //noinspection ResultOfMethodCallIgnored
            apkFile.delete();
        }

        HttpURLConnection connection = null;
        try {
            // Follow redirects by hand, so every hop is held to the same
            // HTTPS + Vercel Blob rule as the manifest's own URL.
            URL current = release.apkUrl;
            int redirects = 0;
            while (true) {
                connection = (HttpURLConnection) current.openConnection();
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
                    connection = null;
                    if (location == null || ++redirects > MAX_REDIRECTS) {
                        throw new IOException("Too many redirects while downloading the update");
                    }
                    current = new URL(current, location);
                    if (!isAllowedDownload(current)) {
                        throw new IOException("The download was redirected to an untrusted host");
                    }
                    continue;
                }
                if (code != HttpURLConnection.HTTP_OK) {
                    throw new IOException("Download failed (HTTP " + code + ")");
                }
                break;
            }

            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            long total = connection.getContentLengthLong();
            long received = 0;
            long lastEmit = 0;
            byte[] buffer = new byte[16 * 1024];

            try (InputStream in = connection.getInputStream();
                 FileOutputStream out = new FileOutputStream(apkFile)) {
                int read;
                while ((read = in.read(buffer)) != -1) {
                    out.write(buffer, 0, read);
                    digest.update(buffer, 0, read);
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

            if (!toHex(digest.digest()).equals(release.sha256)) {
                //noinspection ResultOfMethodCallIgnored
                apkFile.delete();
                throw new IOException("The downloaded file failed its SHA-256 check");
            }
            return apkFile;
        } finally {
            if (connection != null) {
                connection.disconnect();
            }
        }
    }

    private static String readLimited(InputStream in, int maxBytes) throws IOException {
        try (InputStream stream = in; ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            byte[] buffer = new byte[4096];
            int read;
            while ((read = stream.read(buffer)) != -1) {
                if (out.size() + read > maxBytes) {
                    throw new IOException("The release manifest is too large");
                }
                out.write(buffer, 0, read);
            }
            return new String(out.toByteArray(), StandardCharsets.UTF_8);
        }
    }

    private static String toHex(byte[] bytes) {
        StringBuilder hex = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            hex.append(String.format(Locale.ROOT, "%02x", b));
        }
        return hex.toString();
    }
}
