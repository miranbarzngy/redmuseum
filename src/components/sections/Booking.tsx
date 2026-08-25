import { BookingClient } from "./BookingClient";

// Face scan is disabled site-wide: the browser-side liveness check proved
// unreliable for real visitors. The admin toggle and upload endpoint are
// left in place in case the feature gets revisited, but the booking flow
// no longer offers it regardless of the stored setting.
export async function Booking() {
  return <BookingClient faceScanEnabled={false} />;
}
