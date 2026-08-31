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
  guestCount: z.coerce.number().int().min(1).max(200),
  visitorType: z.enum(["school", "delegation", "personal", "press", "other"]),
  note: z.string().optional(),
  // The wizard's photo step is optional (camera access can be denied, or
  // the visitor can skip it) — so this is never required server-side.
  faceImagePath: z.string().min(1).nullable().optional(),
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

  // Generated here rather than read back from the insert: the public
  // booking flow uses the anon client, and bookings has an INSERT-only RLS
  // policy (no SELECT for anon), so `.insert().select()` would come back
  // empty. This is the same 32-hex-char shape as the column's DB default;
  // the visitor's confirmation screen turns it into the QR code that links
  // to /[locale]/booking/<token>.
  const publicToken = crypto.randomUUID().replace(/-/g, "");

  const { error } = await supabase.from("bookings").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    visit_date: parsed.data.visitDate,
    guest_count: parsed.data.guestCount,
    visitor_type: parsed.data.visitorType,
    note: parsed.data.note || null,
    face_image_path: parsed.data.faceImagePath ?? null,
    face_scan_consent: Boolean(parsed.data.faceImagePath),
    public_token: publicToken,
  });

  if (error) {
    console.error("[booking] failed to save booking", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token: publicToken });
}
