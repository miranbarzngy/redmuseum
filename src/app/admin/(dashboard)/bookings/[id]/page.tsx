import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, Phone, ScanFace } from "lucide-react";
import { DeleteButton } from "../../../_components/DeleteButton";
import { getBooking, deleteBooking } from "../actions";
import { formatVisitDate, formatSubmittedAt } from "../formatBookingDate";
import { StatusSelect } from "../StatusSelect";

export default async function AdminBookingDetailPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  const booking = await getBooking(params.id);

  if (!booking) notFound();

  return (
    <div className="flex flex-col gap-6">
      <Link
        href="/admin/bookings"
        className="inline-flex w-fit items-center gap-1.5 text-fluid-sm font-medium text-ink-soft transition-colors hover:text-pigment-terracotta"
      >
        <ArrowRight size={16} /> گەڕانەوە بۆ سەردانەکان
      </Link>

      <div className="max-w-2xl rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-ink/10 pb-6">
          <div>
            <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">{booking.name}</h1>
            <a
              href={`tel:${booking.phone}`}
              className="mt-1 inline-flex items-center gap-1.5 text-fluid-sm text-pigment-terracotta hover:underline"
            >
              <Phone size={14} /> {booking.phone}
            </a>
          </div>
          <div className="text-end text-fluid-xs text-ink-faint">
            <div>سەردان لە {formatVisitDate(booking.visit_date)}</div>
            <div className="mt-1">نێردراوە لە {formatSubmittedAt(booking.created_at)}</div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 py-6">
          <span className="text-fluid-xs font-medium text-ink-soft">دۆخ:</span>
          <StatusSelect id={booking.id} status={booking.status} />
        </div>

        {booking.note && (
          <p className="whitespace-pre-wrap border-t border-ink/10 py-6 text-fluid-base leading-relaxed text-ink">
            {booking.note}
          </p>
        )}

        {booking.face_vector_data && (
          <div className="flex items-center gap-2 border-t border-ink/10 py-6 text-fluid-sm text-pigment-teal">
            <ScanFace size={16} />
            ڕوخساری میوانەکە لە کاتی داواکاریدا پشتڕاستکراوەتەوە.
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 border-t border-ink/10 pt-6">
          <a
            href={`tel:${booking.phone}`}
            className="inline-flex items-center gap-1.5 rounded-full bg-ink px-5 py-2.5 text-fluid-sm font-medium text-canvas transition-colors hover:bg-pigment-terracotta"
          >
            <Phone size={15} /> پەیوەندیکردن
          </a>
          <DeleteButton
            action={deleteBooking.bind(null, booking.id)}
            confirmMessage="ئەم سەردانە بسڕدرێتەوە؟ ناتوانرێت هەڵبوەشێندرێتەوە."
          />
        </div>
      </div>
    </div>
  );
}
