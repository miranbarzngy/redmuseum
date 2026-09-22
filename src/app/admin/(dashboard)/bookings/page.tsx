import { getBookings, getFacePhotoUrls } from "./actions";
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

  const facePhotoPaths = bookings
    .map((b) => b.face_image_path)
    .filter((path): path is string => Boolean(path));
  const facePhotoUrls = await getFacePhotoUrls(facePhotoPaths);

  return (
    <div className="flex flex-col gap-8 mb-24 lg:mb-0">
      <PageHeader
        title="سەردانەکان"
        description="داواکاری سەردانی مۆزەخانە لە فۆرمی «سەردان»ی ماڵپەڕی گشتییەوە."
      />

      <BookingsTabs />

      <BookingsBoard
        bookings={bookings}
        visitorTypes={visitorTypes ?? []}
        facePhotoUrls={facePhotoUrls}
        initialViewId={view ?? null}
      />
    </div>
  );
}
