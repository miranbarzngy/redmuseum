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

  const { error } = await supabase.from("bookings").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    visit_date: parsed.data.visitDate,
    note: parsed.data.note || null,
    face_image_path: parsed.data.faceImagePath ?? null,
    face_scan_consent: Boolean(parsed.data.faceImagePath),
  });

  if (error) {
    console.error("[booking] failed to save booking", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
