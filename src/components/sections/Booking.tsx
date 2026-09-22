import { getBookingSettings } from "@/lib/data/bookingSettings";
import { getBookingVisitorTypes } from "@/lib/data/bookingVisitorTypes";
import { BookingClient } from "./BookingClient";

export async function Booking() {
  const [settings, visitorTypes] = await Promise.all([getBookingSettings(), getBookingVisitorTypes()]);
  return <BookingClient settings={settings} visitorTypes={visitorTypes} />;
}
