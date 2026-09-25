import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { clientIp } from "@/lib/clientIp";
import type { BookingStatus } from "@/lib/supabase/database.types";

const schema = z.object({
  phone: z.string().min(4).max(40),
});

/** Keep only digits, then the significant tail — drops +964 / 00964 / a
 * leading 0 so "+964 770 123 4567", "0770 123 4567" and "7701234567" all
 * compare equal. Must match the bookings.phone_key generated column
 * (0062_bookings_phone_key.sql), which is what the query filters on. */
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

  // Two independent cooldowns — phone numbers are guessable, so this
  // endpoint must not be usable to enumerate them. The per-IP one (0035) is
  // keyed on a client-influenceable header (see clientIp.ts) and can be
  // bypassed by spoofing a fresh value on every request; the per-phone one
  // (0043) can't be dodged that way since the attacker can't change which
  // number they're checking. Both must allow the attempt. Called through
  // the service-role client: neither function is executable with the
  // public anon key (0063), so they can't be driven from outside this route.
  const supabase = createAdminClient();
  const { data: ipAllowed, error: ipThrottleError } = await supabase.rpc(
    "check_booking_lookup_attempt",
    { client_ip: await clientIp() }
  );
  if (ipThrottleError) {
    console.error("[booking/lookup] IP throttle check failed", ipThrottleError.message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
  if (!ipAllowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  const { data: phoneAllowed, error: phoneThrottleError } = await supabase.rpc(
    "check_booking_lookup_attempt_by_phone",
    { p_phone_key: key }
  );
  if (phoneThrottleError) {
    console.error("[booking/lookup] phone throttle check failed", phoneThrottleError.message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }
  if (!phoneAllowed) {
    return NextResponse.json({ ok: false, error: "rate_limited" }, { status: 429 });
  }

  // bookings has no anon SELECT policy; read with the service-role client,
  // same as the QR status page. Never return name / token here: a phone
  // match is a weak proof of identity, so this only ever exposes date +
  // status, and the full (name-bearing) detail page stays reachable only
  // via the QR token.
  const { data, error } = await supabase
    .from("bookings")
    .select("visit_date, status, guest_count, public_token")
    .eq("phone_key", key)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("[booking/lookup] query failed", error.message);
    return NextResponse.json({ ok: false, error: "server_error" }, { status: 500 });
  }

  const bookings = (data ?? []).map((b) => ({
    reference: b.public_token.slice(0, 8).toUpperCase(),
    visitDate: b.visit_date,
    status: b.status as BookingStatus,
    guestCount: b.guest_count,
  }));

  return NextResponse.json({ ok: true, bookings });
}
