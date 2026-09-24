import "server-only";
import { randomUUID } from "node:crypto";
import sharp from "sharp";
import type { createAdminClient } from "./admin";

// Allow-listed by MIME type, not by the client-supplied filename extension —
// a filename is just a string the uploader picked, so trusting its
// extension (or its declared content-type at upload time) would let any
// admin with only gallery/museums-scoped permission — not just a Super
// Admin — upload something like `x.svg` containing an inline <script> to
// this public-read bucket. The extension used for the stored path and the
// contentType passed to storage.upload() both come from this map instead.
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function assertAllowedImage(file: File): string {
  const ext = ALLOWED_IMAGE_TYPES[file.type];
  if (!ext) {
    throw new Error("Unsupported image type. Use JPEG, PNG, WEBP, GIF, or AVIF.");
  }
  return ext;
}

// Caps every upload's longer edge and re-encodes to WEBP so the `artwork`
// bucket doesn't fill up with untouched multi-megabyte phone photos — 2000px
// comfortably covers the largest thing we render (the hero banner) with
// room to spare. Quality 90 sits at the "visually lossless" end of WEBP —
// museum/artifact photos and cover cards with fine text keep their detail —
// while `effort: 6` (max) squeezes the file further at that same quality.
// `smartSubsample` keeps sharp colour edges (red text, fine painted lines)
// from bleeding the way default 4:2:0 chroma subsampling does.
// The admin forms pre-shrink big photos in the browser (shrinkImage.ts)
// before they get here, only to keep the request under the body limit.
// Animated GIFs are passed through as-is: sharp's default pipeline only
// keeps the first frame, which would silently kill the animation.
const MAX_DIMENSION = 2000;
const WEBP_QUALITY = 90;

async function optimizeImage(file: File): Promise<{ buffer: Buffer; contentType: string; ext: string }> {
  if (file.type === "image/gif") {
    return { buffer: Buffer.from(await file.arrayBuffer()), contentType: file.type, ext: "gif" };
  }

  const input = Buffer.from(await file.arrayBuffer());
  const buffer = await sharp(input)
    .rotate()
    .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
    .webp({ quality: WEBP_QUALITY, effort: 6, smartSubsample: true })
    .toBuffer();

  return { buffer, contentType: "image/webp", ext: "webp" };
}

/**
 * Uploads `fieldName` (a file input) to the `artwork` storage bucket if a
 * file was actually chosen, falling back to a plain pasted URL from
 * `urlFieldName`. Returns `undefined` to mean "leave the existing value
 * unchanged" — the caller decides whether that's meaningful (edit forms)
 * or should be treated as "no image" (create forms).
 */
export async function resolveUploadedImageUrl(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
  fieldName: string,
  urlFieldName?: string
): Promise<string | null | undefined> {
  const file = formData.get(fieldName);
  const urlField = urlFieldName ? String(formData.get(urlFieldName) ?? "").trim() : "";

  if (file instanceof File && file.size > 0) {
    assertAllowedImage(file);
    const { buffer, contentType, ext } = await optimizeImage(file);
    const path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("artwork").upload(path, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);

    const { data } = supabase.storage.from("artwork").getPublicUrl(path);
    return data.publicUrl;
  }

  if (urlField) return urlField;

  return undefined;
}

/**
 * Uploads every file chosen under `fieldName` (a `multiple` file input) to
 * the `artwork` bucket and returns their public URLs, in selection order.
 * Returns an empty array if no files were chosen.
 */
export async function resolveUploadedImageUrls(
  supabase: ReturnType<typeof createAdminClient>,
  formData: FormData,
  fieldName: string
): Promise<string[]> {
  const files = formData.getAll(fieldName).filter((f): f is File => f instanceof File && f.size > 0);

  const urls: string[] = [];
  for (const file of files) {
    assertAllowedImage(file);
    const { buffer, contentType, ext } = await optimizeImage(file);
    const path = `${randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from("artwork").upload(path, buffer, {
      contentType,
      cacheControl: "31536000",
      upsert: false,
    });
    if (error) throw new Error(`Image upload failed: ${error.message}`);

    const { data } = supabase.storage.from("artwork").getPublicUrl(path);
    urls.push(data.publicUrl);
  }
  return urls;
}
