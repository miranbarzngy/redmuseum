// Browser-side pre-shrink for admin photo uploads. Phone photos are often
// 4–12 MB, and every file in a form rides in one Server Action body capped at
// 10mb (next.config), so a gallery of a few raw photos can fail outright.
//
// This only exists to shrink the *transfer* — the server (uploadImage.ts)
// still does the real optimization to 2000px WEBP. So we stay deliberately
// above that: a 2560px long edge and WEBP quality 0.95 leave the server's
// final downscale + encode indistinguishable from starting at the original.
const MAX_DIMENSION = 2560;
const QUALITY = 0.95;
// Small files are left alone — nothing meaningful to save.
const MIN_BYTES_TO_SHRINK = 1.5 * 1024 * 1024;

async function shrinkOne(file: File): Promise<File> {
  // GIFs may be animated (canvas keeps only the first frame); SVG isn't accepted
  // by the server anyway.
  if (!file.type.startsWith("image/") || file.type === "image/gif" || file.type === "image/svg+xml") {
    return file;
  }

  // "from-image" bakes the EXIF orientation into the pixels, since the
  // canvas re-encode drops the EXIF tag the server would otherwise rotate by.
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  try {
    const scale = Math.min(1, MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    if (scale === 1 && file.size < MIN_BYTES_TO_SHRINK) return file;

    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", QUALITY));
    // Browsers without WEBP encoding hand back a PNG instead — often larger
    // than the source, and never what we asked for, so keep the original.
    if (!blob || blob.type !== "image/webp" || blob.size >= file.size) return file;

    const baseName = file.name.replace(/\.[^.]+$/, "") || "image";
    return new File([blob], `${baseName}.webp`, { type: "image/webp", lastModified: file.lastModified });
  } finally {
    bitmap.close();
  }
}

/**
 * Replaces the files in `input` with pre-shrunk copies. While it runs, the
 * input is marked invalid so the form can't be submitted half-processed.
 * Any file that fails to decode is uploaded as-is and the server decides.
 */
export async function shrinkInputFiles(input: HTMLInputElement): Promise<void> {
  const files = Array.from(input.files ?? []);
  if (files.length === 0) return;

  input.setCustomValidity("وێنەکان ئامادە دەکرێن، تکایە چاوەڕێ بکە…");
  try {
    const shrunk = await Promise.all(files.map((f) => shrinkOne(f).catch(() => f)));
    if (shrunk.every((f, i) => f === files[i])) return;
    // The admin picked again while we were working — don't clobber that.
    if (input.files?.[0] !== files[0]) return;

    const dt = new DataTransfer();
    shrunk.forEach((f) => dt.items.add(f));
    input.files = dt.files;
  } finally {
    input.setCustomValidity("");
  }
}
