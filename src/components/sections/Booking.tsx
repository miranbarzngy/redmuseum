import { getBookingSettings } from "@/lib/data/bookingSettings";
import { getBookingVisitorTypes } from "@/lib/data/bookingVisitorTypes";
import { getFaceScanEnabled } from "@/lib/data/settings";
import { BookingClient } from "./BookingClient";

export async function Booking() {
  const [settings, visitorTypes, faceScanEnabled] = await Promise.all([
    getBookingSettings(),
    getBookingVisitorTypes(),
    getFaceScanEnabled(),
  ]);
  return <BookingClient settings={settings} visitorTypes={visitorTypes} faceScanEnabled={faceScanEnabled} />;
}
