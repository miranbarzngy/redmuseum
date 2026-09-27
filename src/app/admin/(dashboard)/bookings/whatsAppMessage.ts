import type { BookingRow } from "@/lib/supabase/database.types";
import { formatVisitDate } from "./formatBookingDate";

/** Placeholders a WhatsApp message (whatsapp_templates.body, 0067) can use.
 * The editor under /admin/whatsapp shows them as tap-to-insert chips;
 * fillWhatsAppMessage swaps each one for the booking's own value. */
export const WHATSAPP_MESSAGE_TOKENS = [
  { token: "{name}", label: "ناوی میوان" },
  { token: "{date}", label: "بەرواری سەردان" },
  { token: "{time}", label: "کاتژمێری سەردان" },
  { token: "{guests}", label: "ژمارەی میوان" },
  { token: "{code}", label: "ژمارەی سەردان" },
  { token: "{link}", label: "لینکی کۆدی QR" },
] as const;

// Same limits as the check constraints in 0067.
export const WHATSAPP_TITLE_MAX_LENGTH = 80;
export const WHATSAPP_MESSAGE_MAX_LENGTH = 1000;

/** The message with every placeholder filled in for this booking. `origin`
 * is the site's own origin — {link} has to be absolute to be tappable in
 * WhatsApp, and the admin runs on the same host as the public status page. */
export function fillWhatsAppMessage(template: string, booking: BookingRow, origin: string): string {
  const values: Record<string, string> = {
    "{name}": booking.name,
    // Slashes, not hyphens: after Kurdish letters the bidi algorithm treats
    // the digits as Arabic numbers, which "/" keeps together but "-" doesn't
    // — "2026-10-03" would show up in WhatsApp as "03-10-2026".
    "{date}": formatVisitDate(booking.visit_date).replaceAll("-", "/"),
    "{time}": booking.visit_time ?? "—",
    "{guests}": String(booking.guest_count),
    "{code}": booking.public_token.slice(0, 8).toUpperCase(),
    "{link}": `${origin}/ku/booking/${booking.public_token}`,
  };
  return template.replace(/\{(?:name|date|time|guests|code|link)\}/g, (token) => values[token]);
}
