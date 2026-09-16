/** Visitor/sender phone numbers are entered in local format ("07xxxxxxxx",
 * no country code) — wa.me needs the full international number, so a
 * leading 0 is swapped for Iraq's 964. Numbers already in international
 * form pass through untouched. Best-effort: WhatsApp itself errors on a bad
 * number, so a wrong guess here is a dead link, not a broken page. Shared by
 * MessageDrawer and BookingDrawer. */
export function toWhatsAppLink(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  const international = digits.startsWith("0") ? `964${digits.slice(1)}` : digits;
  return `https://wa.me/${international}`;
}
