import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const schema = z.object({
  name: z.string().min(1),
  phone: z
    .string()
    .min(7)
    .regex(/^[0-9+\-\s()]+$/),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  note: z.string().optional(),
  faceImagePath: z.string().min(1).nullable().optional(),
  faceScanConsent: z.boolean().optional(),
});

function isPastDate(visitDate: string): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${visitDate}T00:00:00`) < today;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  if (isPastDate(parsed.data.visitDate)) {
    return NextResponse.json({ ok: false, error: "visit_date_in_past" }, { status: 400 });
  }

  const supabase = createClient();

  // Never trust the client's face-scan payload — re-check the live flag
  // here so a request built by hand (bypassing the UI, which only shows
  // the camera step when the flag was on at page-load) can't smuggle
  // biometric data in while the feature is administratively off.
  const { data: settings, error: settingsError } = await supabase
    .from("system_settings")
    .select("enable_face_scan")
    .eq("id", 1)
    .maybeSingle();

  if (settingsError) {
    console.error("[booking] failed to load system settings", settingsError.message);
    return NextResponse.json({ ok: false, error: "settings_load_failed" }, { status: 500 });
  }

  const faceScanEnabled = settings?.enable_face_scan ?? false;

  // Mirrors the UI's fieldsLocked gate: when the admin has face scan on, a
  // booking can't exist without a verified scan — a hand-built request that
  // skips the client-side lock still gets rejected here.
  if (faceScanEnabled && !parsed.data.faceImagePath) {
    return NextResponse.json({ ok: false, error: "face_scan_required" }, { status: 400 });
  }

  const { error } = await supabase.from("bookings").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    visit_date: parsed.data.visitDate,
    note: parsed.data.note || null,
    face_image_path: faceScanEnabled ? (parsed.data.faceImagePath ?? null) : null,
    face_scan_consent: faceScanEnabled ? (parsed.data.faceScanConsent ?? false) : false,
  });

  if (error) {
    console.error("[booking] failed to save booking", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
