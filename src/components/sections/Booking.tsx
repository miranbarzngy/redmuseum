import { getBookingSettings } from "@/lib/data/bookingSettings";
import { BookingClient } from "./BookingClient";

export async function Booking() {
  const settings = await getBookingSettings();
  return <BookingClient settings={settings} />;
}
