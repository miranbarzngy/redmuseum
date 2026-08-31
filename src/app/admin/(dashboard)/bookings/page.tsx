import { getBookings } from "./actions";
import { BookingsTabs } from "./BookingsTabs";
import { BookingsBoard } from "./BookingsBoard";
import { PageHeader } from "../../_components/PageHeader";

export default async function AdminBookingsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const { view } = await searchParams;
  const bookings = await getBookings();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="سەردانەکان"
        description="داواکاری سەردانی مۆزەخانە لە فۆرمی «سەردان»ی ماڵپەڕی گشتییەوە."
      />

      <BookingsTabs />

      <BookingsBoard bookings={bookings} initialViewId={view ?? null} />
    </div>
  );
}
