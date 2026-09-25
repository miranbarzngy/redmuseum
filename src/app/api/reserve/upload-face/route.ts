import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitedResponse, withinRateLimit } from "@/lib/rateLimit";
import { getFaceScanEnabled } from "@/lib/data/settings";

// Public endpoint hit by PhotoCapture.tsx during the booking flow, before a
// booking row exists — so it can't be gated by requireAdminSession() the
// way the rest of the admin/service-role call sites are. Instead it's
// gated by: (1) a per-IP rate limit, (2) strict size validation plus a
// full decode-and-re-encode (so only a real JPEG, with no smuggled payload
// or EXIF/GPS metadata, is ever stored), (3) a random, unguessable storage
// path (never the client's filename), and (4) the destination bucket being
// fully private (see 0024_face_scan_photos.sql) — so even though this
// route *writes* without a session, nothing can *read* the result back
// except the service-role client via a short-lived signed URL.
// PhotoCapture.tsx compresses toward ~150 KB before this ever gets hit;
// this is just the hard ceiling for a request that skips that client-side
// path entirely (this route has no auth — a direct POST is possible).
const MAX_BYTES = 1024 * 1024;
const MAX_DIMENSION = 1600;
const SIGNED_URL_TTL_SECONDS = 60 * 60;

async function reencodeJpeg(file: File): Promise<Buffer | null> {
  try {
    const input = Buffer.from(await file.arrayBuffer());
    const image = sharp(input, { limitInputPixels: 40_000_000 });
    const { format } = await image.metadata();
    if (format !== "jpeg") return null;
    // sharp drops all metadata (EXIF, GPS, embedded thumbnails) unless
    // asked to keep it; .rotate() bakes the EXIF orientation in first.
    return await image
      .rotate()
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 85, mozjpeg: true })
      .toBuffer();
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  // Admin Settings' face-scan toggle: when off, no face photo is taken or
  // stored at all — the booking wizard hides the step, and this refuses a
  // direct POST too.
  if (!(await getFaceScanEnabled())) {
    return NextResponse.json({ ok: false, error: "face_scan_disabled" }, { status: 403 });
  }

  if (!(await withinRateLimit("faceUpload"))) {
    return rateLimitedResponse();
  }

  const formData = await request.formData().catch(() => null);
  const file = formData?.get("face");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
  }

  const jpeg = await reencodeJpeg(file);
  if (!jpeg) {
    return NextResponse.json({ ok: false, error: "invalid_type" }, { status: 400 });
  }

  const path = `${randomUUID()}.jpg`;
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage.from("face-scans").upload(path, jpeg, {
    contentType: "image/jpeg",
    cacheControl: "0",
    upsert: false,
  });

  if (uploadError) {
    console.error("[upload-face] upload failed", uploadError.message);
    return NextResponse.json({ ok: false, error: "upload_failed" }, { status: 500 });
  }

  const { data: signed, error: signError } = await supabase.storage
    .from("face-scans")
    .createSignedUrl(path, SIGNED_URL_TTL_SECONDS);

  if (signError || !signed) {
    console.error("[upload-face] signing failed", signError?.message);
    return NextResponse.json({ ok: false, error: "sign_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, url: signed.signedUrl, path });
}
