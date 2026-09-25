import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { rateLimitedResponse, withinRateLimit } from "@/lib/rateLimit";
import { getFaceScanEnabled } from "@/lib/data/settings";

// Only ever the `${randomUUID()}.jpg` shape /api/reserve/upload-face hands
// out — never an arbitrary storage path.
const FACE_IMAGE_PATH = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.jpg$/;

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  phone: z
    .string()
    .min(7)
    .max(30)
    .regex(/^[0-9+\-\s()]+$/),
  visitDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  visitTime: z.string().regex(/^\d{2}:\d{2}$/),
  guestCount: z.coerce.number().int().min(1).max(200),
  visitorTypeId: z.string().min(1).max(64),
  note: z.string().trim().max(1000).optional(),
  // The wizard's photo step is optional (camera access can be denied, or
  // the visitor can skip it) — so this is never required server-side. It's
  // dropped entirely when admin Settings' face-scan toggle is off.
  faceImagePath: z.string().regex(FACE_IMAGE_PATH).nullable().optional(),
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

  if (!(await withinRateLimit("booking"))) {
    return rateLimitedResponse();
  }

  // Service-role client: bookings has no anon INSERT policy (see
  // 0063_lock_down_anon_writes.sql), so this route is the only way a booking
  // gets created — which is what makes the validation above binding. status
  // is never taken from the request; every new booking starts as the
  // column default, 'pending'.
  const supabase = createAdminClient();

  // visitor_type_id is an FK (see 0051) — check it against a live category
  // before inserting so a stale/tampered id comes back as a normal
  // invalid_input 400 instead of surfacing as a generic save_failed once it
  // trips the FK constraint at insert time.
  const { data: visitorType } = await supabase
    .from("booking_visitor_types")
    .select("id")
    .eq("id", parsed.data.visitorTypeId)
    .maybeSingle();
  if (!visitorType) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const faceImagePath = parsed.data.faceImagePath && (await getFaceScanEnabled()) ? parsed.data.faceImagePath : null;

  // Generated here so the visitor's confirmation screen can turn it into
  // the QR code that links to /[locale]/booking/<token>. Same 32-hex-char
  // shape as the column's DB default.
  const publicToken = crypto.randomUUID().replace(/-/g, "");

  const { error } = await supabase.from("bookings").insert({
    name: parsed.data.name,
    phone: parsed.data.phone,
    visit_date: parsed.data.visitDate,
    visit_time: parsed.data.visitTime,
    guest_count: parsed.data.guestCount,
    visitor_type_id: parsed.data.visitorTypeId,
    note: parsed.data.note || null,
    face_image_path: faceImagePath,
    face_scan_consent: Boolean(faceImagePath),
    public_token: publicToken,
  });

  if (error) {
    // 23505 = unique violation on bookings_face_image_path_key (0058): the
    // photo is already attached to another booking.
    if (error.code === "23505") {
      return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
    }
    console.error("[booking] failed to save booking", error.message);
    return NextResponse.json({ ok: false, error: "save_failed" }, { status: 500 });
  }

  return NextResponse.json({ ok: true, token: publicToken });
}
