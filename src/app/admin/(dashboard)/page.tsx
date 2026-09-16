import Link from "next/link";
import { CalendarClock, Mail } from "lucide-react";
import { getMessages } from "./messages/actions";
import { getBookings } from "./bookings/actions";
import { formatMessageDateParts } from "./messages/formatMessageDate";
import { formatVisitDate } from "./bookings/formatBookingDate";
import { getVisitStats } from "./getVisitStats";
import { AnalyticsSection } from "./AnalyticsSection";
import { PageHeader } from "../_components/PageHeader";
import { Panel } from "../_components/Panel";

export default async function AdminOverviewPage() {
  const [visitStats, bookings, messages] = await Promise.all([
    getVisitStats(),
    getBookings(),
    getMessages(),
  ]);

  const pending = bookings.filter((b) => b.status === "pending");
  const unread = messages.filter((m) => !m.is_read);

  return (
    <div className="flex flex-col gap-8 mb-24 lg:mb-0">
      <PageHeader title="گشتی" description="بەڕێوەبردنی ناوەڕۆکی پیشاندراو لە ماڵپەڕی گشتیدا." />

      <div className="grid gap-6 md:grid-cols-2">
        <Panel
          title="سەردانی چاوەڕوان"
          description={pending.length > 0 ? `${pending.length} داواکاری چاوەڕوانی پشتڕاستکردنەوەیە` : undefined}
          action={
            <Link
              href="/admin/bookings"
              className="font-kurdish text-fluid-xs font-medium text-[#850B10] hover:underline"
            >
              هەموو
            </Link>
          }
          bodyClassName="flex flex-col gap-1"
        >
          {pending.length === 0 ? (
            <p className="font-kurdish text-fluid-xs text-ink-faint">هیچ داواکارییەک چاوەڕێ ناکات.</p>
          ) : (
            pending.slice(0, 4).map((b) => (
              <Link
                key={b.id}
                href={`/admin/bookings?view=${b.id}`}
                className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-canvas-paper"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#850B10] text-white">
                  <CalendarClock size={14} />
                </span>
                <span className="min-w-0 flex-1 truncate text-fluid-sm text-ink">{b.name}</span>
                <span dir="ltr" className="shrink-0 text-fluid-xs text-ink-faint">
                  {formatVisitDate(b.visit_date)}
                </span>
              </Link>
            ))
          )}
        </Panel>

        <Panel
          title="پەیامی نەخوێندراو"
          description={unread.length > 0 ? `${unread.length} پەیامی نەخوێندراوە` : undefined}
          action={
            <Link
              href="/admin/messages"
              className="font-kurdish text-fluid-xs font-medium text-[#850B10] hover:underline"
            >
              هەموو
            </Link>
          }
          bodyClassName="flex flex-col gap-1"
        >
          {unread.length === 0 ? (
            <p className="font-kurdish text-fluid-xs text-ink-faint">هەموو پەیامەکان خوێندراونەتەوە.</p>
          ) : (
            unread.slice(0, 4).map((m) => {
              const { time, date } = formatMessageDateParts(m.created_at);
              return (
                <Link
                  key={m.id}
                  href={`/admin/messages/${m.id}`}
                  className="flex items-center gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-canvas-paper"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#850B10] text-white">
                    <Mail size={14} />
                  </span>
                  <span className="min-w-0 flex-1 truncate text-fluid-sm text-ink">{m.name}</span>
                  <span dir="ltr" className="flex shrink-0 flex-col items-end text-fluid-xs text-ink-faint">
                    <span>{time}</span>
                    <span>{date}</span>
                  </span>
                </Link>
              );
            })
          )}
        </Panel>
      </div>

      <AnalyticsSection stats={visitStats} />
    </div>
  );
}
