/**
 * Uploads the built admin-app installers to Vercel Blob and prints the
 * APP_* env vars the Settings > "داگرتنی ئەپەکان" panel and the Android
 * in-app updater read (see src/lib/appVersionManifest.ts).
 *
 *   npm run release:upload          # APK + EXE
 *   npm run release:upload -- apk   # just one of them
 *
 * Needs BLOB_READ_WRITE_TOKEN (from a *public* Blob store) in .env.local.
 * Versions come from android/app/build.gradle and electron/package.json,
 * so build first: `npm run android:release` / `npm run windows:release`.
 * Blob paths carry the version, so a new release never gets served a
 * CDN-cached copy of the old file.
 *
 * The APK's SHA-256 is computed here, from the file on disk, and printed as
 * APP_APK_SHA256: the Android shell (1.5+) installs an update only if the
 * download matches it, so a release published without it isn't offered.
 */
import { createHash } from "node:crypto";
import { createReadStream, openAsBlob, readFileSync, statSync, existsSync } from "node:fs";
import { put } from "@vercel/blob";

async function sha256(file) {
  const hash = createHash("sha256");
  for await (const chunk of createReadStream(file)) hash.update(chunk);
  return hash.digest("hex");
}

if (!process.env.BLOB_READ_WRITE_TOKEN) {
  console.error(
    "BLOB_READ_WRITE_TOKEN is not set. Create a public Blob store in the Vercel\n" +
      "dashboard (Storage > Create > Blob), then copy its token into .env.local.",
  );
  process.exit(1);
}

const wanted = process.argv.slice(2);
const want = (kind) => wanted.length === 0 || wanted.includes(kind);

const gradle = readFileSync("android/app/build.gradle", "utf8");
const versionCode = gradle.match(/versionCode\s+(\d+)/)?.[1];
const versionName = gradle.match(/versionName\s+"([^"]+)"/)?.[1];
const exeVersion = JSON.parse(readFileSync("electron/package.json", "utf8")).version;

const releases = [
  {
    kind: "apk",
    file: "android/app/build/outputs/apk/release/amnasuraka.apk",
    // The version lives in the folder so phones save it as amnasuraka.apk.
    pathname: `app/${versionName}/amnasuraka.apk`,
    contentType: "application/vnd.android.package-archive",
    // An APK built before the versionCode bump would make the in-app
    // updater offer the "new" version forever, since installing it never
    // raises the installed versionCode.
    staleIfOlderThan: "android/app/build.gradle",
    env: (url, digest) => ({
      APP_LATEST_VERSION_CODE: versionCode,
      APP_LATEST_VERSION_NAME: versionName,
      APP_APK_URL: url,
      APP_APK_SHA256: digest,
    }),
  },
  {
    kind: "exe",
    file: `electron/dist/Amna Suraka Admin Setup ${exeVersion}.exe`,
    pathname: `app/amna-suraka-admin-setup-${exeVersion}.exe`,
    contentType: "application/octet-stream",
    staleIfOlderThan: "electron/package.json",
    env: (url) => ({ APP_EXE_VERSION_NAME: exeVersion, APP_EXE_URL: url }),
  },
].filter((r) => want(r.kind));

const envLines = {};

for (const release of releases) {
  if (!existsSync(release.file)) {
    console.warn(`Skipping ${release.kind}: ${release.file} not found — build it first.`);
    continue;
  }
  if (statSync(release.file).mtimeMs < statSync(release.staleIfOlderThan).mtimeMs) {
    console.warn(
      `Warning: ${release.file} is older than ${release.staleIfOlderThan} — ` +
        "it may not contain the current version. Rebuild if you bumped it.",
    );
  }

  const sizeMb = (statSync(release.file).size / 1024 / 1024).toFixed(1);
  const digest = await sha256(release.file);
  console.log(`Uploading ${release.file} (${sizeMb} MB, sha256 ${digest}) → ${release.pathname}`);

  let lastPercent = -1;
  const blob = await put(release.pathname, await openAsBlob(release.file), {
    access: "public",
    contentType: release.contentType,
    multipart: true,
    // Lets a rebuilt installer replace a same-version upload.
    allowOverwrite: true,
    onUploadProgress: ({ percentage }) => {
      const step = Math.floor(percentage / 10) * 10;
      if (step !== lastPercent) {
        lastPercent = step;
        process.stdout.write(`  ${step}%\r`);
      }
    },
  });

  // downloadUrl adds ?download=1, which makes Blob send
  // Content-Disposition: attachment so browsers save the file instead of
  // trying to open it.
  Object.assign(envLines, release.env(blob.downloadUrl, digest));
  console.log(`  done: ${blob.downloadUrl}`);
}

if (Object.keys(envLines).length > 0) {
  console.log(
    "\nSet these in Vercel (Project > Settings > Environment Variables, Production),\n" +
      "then redeploy so the Settings page and the in-app updater pick them up:\n",
  );
  for (const [key, value] of Object.entries(envLines)) console.log(`${key}=${value}`);
}
