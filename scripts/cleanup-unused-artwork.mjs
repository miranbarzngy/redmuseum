/**
 * Sweeps the public image buckets for files no saved content uses any more
 * (artwork_unreferenced(), migration 0074) and, with --delete, backs each
 * one up locally and then deletes it.
 *
 *   npm run artwork:cleanup               # dry run: lists what would go
 *   npm run artwork:cleanup -- --delete   # back up, then delete
 *
 * Since 0074 the admin panel deletes images it replaces or removes itself
 * (removeUnusedArtwork in src/lib/supabase/uploadImage.ts). This clears what
 * piled up before that, plus the legacy museum-media bucket the first admin
 * panel uploaded to. Files under an hour old are skipped, so an upload whose
 * save is still in flight is never touched.
 *
 * Backups go to ~/amnasuraka-artwork-backup-<date>/<bucket>/, outside the
 * repo on purpose (it's public). Needs NEXT_PUBLIC_SUPABASE_URL and
 * SUPABASE_SECRET_KEY in .env.local, and 0074 applied.
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { homedir } from "node:os";
import { dirname, join } from "node:path";
import { createClient } from "@supabase/supabase-js";

const BUCKETS = ["artwork", "museum-media"];
const MIN_AGE_MS = 60 * 60 * 1000;
const PAGE = 1000;
const shouldDelete = process.argv.includes("--delete");

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
if (!url || !secretKey) {
  console.error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY must be set in .env.local.");
  process.exit(1);
}
const supabase = createClient(url, secretKey, { auth: { persistSession: false } });

/** Every file in `bucket` (recursing into folders), with its age and size. */
async function listFiles(bucket, prefix = "") {
  const files = [];
  for (let offset = 0; ; offset += PAGE) {
    const { data, error } = await supabase.storage.from(bucket).list(prefix, { limit: PAGE, offset });
    if (error) throw new Error(`listing ${bucket}/${prefix}: ${error.message}`);
    for (const entry of data) {
      const path = prefix ? `${prefix}/${entry.name}` : entry.name;
      if (!entry.id) files.push(...(await listFiles(bucket, path)));
      else if (entry.name !== ".emptyFolderPlaceholder") {
        files.push({ path, createdAt: entry.created_at, size: entry.metadata?.size ?? 0 });
      }
    }
    if (data.length < PAGE) return files;
  }
}

const backupRoot = join(homedir(), `amnasuraka-artwork-backup-${new Date().toISOString().slice(0, 10)}`);
const mb = (bytes) => (bytes / 1e6).toFixed(1);
let totalFiles = 0;
let totalBytes = 0;

for (const bucket of BUCKETS) {
  const settled = (await listFiles(bucket)).filter(
    (file) => Date.now() - new Date(file.createdAt).getTime() > MIN_AGE_MS
  );
  if (settled.length === 0) continue;

  const { data: unreferenced, error } = await supabase.rpc("artwork_unreferenced", {
    p_names: settled.map((file) => file.path),
  });
  if (error) throw new Error(`reference check for ${bucket}: ${error.message}`);
  const unused = new Set(unreferenced);
  const doomed = settled.filter((file) => unused.has(file.path));
  if (doomed.length === 0) continue;

  const bytes = doomed.reduce((sum, file) => sum + file.size, 0);
  totalFiles += doomed.length;
  totalBytes += bytes;
  console.log(`\n${bucket}: ${doomed.length} unused file(s), ${mb(bytes)} MB`);
  for (const file of doomed) console.log(`  ${file.path}  (${mb(file.size)} MB, ${file.createdAt.slice(0, 10)})`);

  if (!shouldDelete) continue;

  // Every file is saved before any is deleted, so a failed download stops
  // the run with nothing lost.
  for (const file of doomed) {
    const { data: blob, error: downloadError } = await supabase.storage.from(bucket).download(file.path);
    if (downloadError) throw new Error(`backing up ${bucket}/${file.path}: ${downloadError.message}`);
    const out = join(backupRoot, bucket, file.path);
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(await blob.arrayBuffer()));
  }

  for (let i = 0; i < doomed.length; i += 100) {
    const batch = doomed.slice(i, i + 100).map((file) => file.path);
    const { error: removeError } = await supabase.storage.from(bucket).remove(batch);
    if (removeError) throw new Error(`deleting from ${bucket}: ${removeError.message}`);
  }
  console.log(`  deleted; backup in ${join(backupRoot, bucket)}`);
}

console.log(
  totalFiles === 0
    ? "\nNo unused files."
    : `\n${totalFiles} unused file(s), ${mb(totalBytes)} MB${shouldDelete ? " deleted." : ". Re-run with --delete to remove them."}`
);
