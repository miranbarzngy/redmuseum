import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/clientIp";
import type { BookingStatus } from "@/lib/supabase/database.types";

const schema = z.object({
  phone: z.string().min(4).max(40),
});

/** Keep only digits, then the significant tail — drops +964 / 00964 / a
 * leading 0 so "+964 770 123 4567", "0770 123 4567" and "7701234567" all
 * compare equal. */
function phoneKey(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  return digits.length > 9 ? digits.slice(-9) : digits;
}

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  const key = phoneKey(parsed.data.phone);
  if (key.length < 7) {
    return NextResponse.json({ ok: false, error: "invalid_input" }, { status: 400 });
  }

  // Per-IP cooldown (0035) — phone numbers are guessable, so this endpoint
  // must not be usable to enumerate them.
  const { data: allowed, error: throttleError } = await createClient().rpc(
    "check_booking_lookup_attempt",
    { client_ip: await clientIp() }
  );
  if (throttleError) {
    console.error("[booking/lookup] throttle check failed", throttleError.message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
  if (!allowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // bookings has no anon SELECT policy; read with the service-role client,
  // same as the QR status page. The table is small, so normalising the
  // stored phone in JS (Postgres can't strip separators in a filter) is
  // fine. Never return name / token here: a phone match is a weak proof of
  // identity, so this only ever exposes date + status, and the full
  // (name-bearing) detail page stays reachable only via the QR token.
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("bookings")
    .select("phone, visit_date, status, guest_count, public_token, created_at")
    .order("created_at", { ascending: false })
    .limit(2000);

  if (error) {
    console.error("[booking/lookup] query failed", error.message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const bookings = (data ?? [])
    .filter((b) => phoneKey(b.phone) === key)
    .map((b) => ({
      reference: b.public_token.slice(0, 8).toUpperCase(),
      visitDate: b.visit_date,
      status: b.status as BookingStatus,
      guestCount: b.guest_count,
    }));

  return NextResponse.json({ ok: true, bookings });
}
