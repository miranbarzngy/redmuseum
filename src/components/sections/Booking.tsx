import { getFaceScanEnabled } from "@/lib/data/settings";
import { BookingClient } from "./BookingClient";

export async function Booking() {
  const faceScanEnabled = await getFaceScanEnabled();
  return <BookingClient faceScanEnabled={faceScanEnabled} />;
}
