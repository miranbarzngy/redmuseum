import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

// Public endpoint hit by PhotoCapture.tsx during the booking flow, before a
// booking row exists — so it can't be gated by requireAdminSession() the
// way the rest of the admin/service-role call sites are. Instead it's
// gated by: (1) strict file-type/size validation, (2) a random,
// unguessable storage path (never the client's filename), and (3) the
// destination bucket being fully private (see 0024_face_scan_photos.sql) —
// so even though this route *writes* without a session, nothing can *read*
// the result back except the service-role client via a short-lived signed
// URL, which only admins ever request.
const MAX_BYTES = 3 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg"]);
const SIGNED_URL_TTL_SECONDS = 60 * 60;

export async function POST(request: Request) {
  const formData = await request.formData().catch(() => null);
  const file = formData?.get("face");

  if (!(file instanceof File) || file.size === 0) {
    return NextResponse.json({ ok: false, error: "missing_file" }, { status: 400 });
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ ok: false, error: "invalid_type" }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ ok: false, error: "file_too_large" }, { status: 400 });
  }

  const path = `${randomUUID()}.jpg`;
  const supabase = createAdminClient();

  const { error: uploadError } = await supabase.storage.from("face-scans").upload(path, file, {
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
