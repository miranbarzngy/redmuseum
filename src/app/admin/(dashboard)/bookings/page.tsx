import Link from "next/link";
import { getBookings } from "./actions";
import { formatVisitDate } from "./formatBookingDate";
import { StatusSelect } from "./StatusSelect";

export default async function AdminBookingsPage() {
  const bookings = await getBookings();
  const pendingCount = bookings.filter((b) => b.status === "pending").length;

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">سەردانەکان</h1>
        <p className="mt-1 text-fluid-sm text-ink-soft">
          داواکاری سەردانی مۆزەخانە لە فۆرمی «سەردان»ی ماڵپەڕی گشتییەوە.
          {pendingCount > 0 && ` — ${pendingCount} چاوەڕوانی پشتڕاستکردنەوەیە.`}
        </p>
      </div>

      {bookings.length === 0 && <p className="text-fluid-sm text-ink-faint">هێشتا هیچ سەردانێک نییە.</p>}

      <div className="flex flex-col gap-3">
        {bookings.map((b) => (
          <Link
            key={b.id}
            href={`/admin/bookings/${b.id}`}
            className="flex flex-wrap items-center gap-4 rounded-2xl border border-ink/10 bg-white p-4 shadow-card transition-colors hover:border-pigment-terracotta/40"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-fluid-sm font-medium text-ink">
                {b.name} <span className="font-normal text-ink-faint">· {b.phone}</span>
              </div>
              {b.face_image_path && (
                <div className="text-fluid-xs text-pigment-teal">ڕوخسار پشتڕاستکراوەتەوە</div>
              )}
            </div>
            <div className="shrink-0 text-fluid-xs text-ink-faint">{formatVisitDate(b.visit_date)}</div>
            <StatusSelect id={b.id} status={b.status} />
          </Link>
        ))}
      </div>
    </div>
  );
}
