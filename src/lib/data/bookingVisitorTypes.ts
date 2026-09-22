import "server-only";
import { createClient } from "@/lib/supabase/server";
import type { LocalizedText } from "@/data/types";

export interface BookingVisitorTypeOption {
  id: string;
  slug: string;
  label: LocalizedText;
  sortOrder: number;
}

/** Reads booking_visitor_types (0051) — the admin-manageable list of visit
 * categories shown in the public booking form's "جۆری سەردان" dropdown.
 * Unlike bookingSettings, there's no static fallback: the option ids are
 * real uuids the booking API validates against, so an empty read here just
 * means an empty (but not broken) dropdown until the DB is reachable. */
export async function getBookingVisitorTypes(): Promise<BookingVisitorTypeOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("booking_visitor_types")
    .select("*")
    .order("sort_order", { ascending: true });

  if (error) {
    console.error("[data] failed to load booking visitor types", error.message);
    return [];
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    slug: row.slug,
    label: { ku: row.label_ku, en: row.label_en, ar: row.label_ar },
    sortOrder: row.sort_order,
  }));
}
