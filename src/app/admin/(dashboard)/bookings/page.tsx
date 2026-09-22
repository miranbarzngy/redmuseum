import { getBookings } from "./actions";
import { BookingsTabs } from "./BookingsTabs";
import { BookingsBoard } from "./BookingsBoard";
import { PageHeader } from "../../_components/PageHeader";
import { createClient } from "@/lib/supabase/server";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const supabase = createClient();
  const [bookings, { data: visitorTypes }] = await Promise.all([
    getBookings(),
    supabase.from("booking_visitor_types").select("*").order("sort_order", { ascending: true }),
  ]);

  return (
    <div className="flex flex-col gap-8 mb-24 lg:mb-0">
      <PageHeader
        title="سەردانەکان"
        description="داواکاری سەردانی مۆزەخانە لە فۆرمی «سەردان»ی ماڵپەڕی گشتییەوە."
      />

      <BookingsTabs />

      <BookingsBoard bookings={bookings} visitorTypes={visitorTypes ?? []} initialViewId={view ?? null} />
    </div>
  );
}
