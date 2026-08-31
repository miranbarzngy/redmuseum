import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CheckCircle2, Clock, LogIn, XCircle, CircleSlash, ArrowLeft, ArrowRight } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { getDirection } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";
import { localizeDigits } from "@/lib/kurdishCalendar";
import { BrandLockup } from "@/components/BrandLockup";
import type { BookingStatus } from "@/lib/supabase/database.types";

// Status changes in the admin panel and must be reflected immediately when
// the visitor (or a staff member) re-scans the QR — never serve a cached copy.
export const dynamic = "force-dynamic";

const STATUS_META: Record<
  BookingStatus,
  { Icon: typeof CheckCircle2; band: string; text: string; ring: string }
> = {
  pending: { Icon: Clock, band: "bg-pigment-gold/15", text: "text-[#8a6d1f]", ring: "ring-pigment-gold/30" },
  confirmed: { Icon: CheckCircle2, band: "bg-pigment-teal/15", text: "text-pigment-teal", ring: "ring-pigment-teal/30" },
  checked_in: { Icon: LogIn, band: "bg-ink/10", text: "text-ink", ring: "ring-ink/20" },
  cancelled: { Icon: XCircle, band: "bg-pigment-crimson/12", text: "text-pigment-crimson", ring: "ring-pigment-crimson/30" },
  no_show: { Icon: CircleSlash, band: "bg-ink/5", text: "text-ink-faint", ring: "ring-ink/10" },
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "booking" });
  return { title: t("statusPage.title"), robots: { index: false, follow: false } };
}

function Row({ label, value, ltr = false }: { label: string; value: React.ReactNode; ltr?: boolean }) {
  return (
    <div className="flex items-start justify-between gap-6 border-b border-ink/5 py-3 last:border-0">
      <dt className="shrink-0 text-fluid-xs font-medium text-ink-faint">{label}</dt>
      <dd className="text-end text-fluid-sm text-ink" dir={ltr ? "ltr" : undefined}>
        {value}
      </dd>
    </div>
  );
}

export default async function BookingStatusPage({
  params,
}: {
  params: Promise<{ locale: string; token: string }>;
}) {
  const { locale, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "booking" });
  const dir = getDirection(locale);
  const BackArrow = dir === "rtl" ? ArrowRight : ArrowLeft;

  const supabase = createAdminClient();
  const { data: booking } = await supabase
    .from("bookings")
    .select("name, phone, guest_count, visitor_type, visit_date, note, status, created_at")
    .eq("public_token", token)
    .maybeSingle();

  if (!booking) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-canvas px-6 text-center">
        <p className="text-fluid-base text-ink-soft">{t("statusPage.notFound")}</p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-fluid-sm font-medium text-[#850B10] hover:underline"
        >
          <BackArrow size={16} />
          {t("statusPage.backHome")}
        </Link>
      </main>
    );
  }

  const status = booking.status;
  const meta = STATUS_META[status];
  const { Icon } = meta;

  const weekdays = t.raw("weekdays") as string[];
  const d = new Date(`${booking.visit_date}T00:00:00Z`);
  const dateLabel = `${weekdays[d.getUTCDay()] ?? ""} · ${localizeDigits(d.getUTCDate(), locale)} ${t(
    "monthLabel",
    { month: localizeDigits(d.getUTCMonth() + 1, locale) }
  )}`;

  return (
    <main className="flex min-h-screen flex-col items-center bg-canvas px-5 py-12 sm:py-16">
      <Link href="/" className="mb-8 transition-opacity hover:opacity-80">
        <BrandLockup />
      </Link>

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-[#c8a96e]/25 bg-white shadow-soft">
        {/* Big status banner */}
        <div className={`flex flex-col items-center gap-3 px-6 py-9 text-center ${meta.band}`}>
          <span className={`flex h-16 w-16 items-center justify-center rounded-full bg-white/70 ring-4 ${meta.ring} ${meta.text}`}>
            <Icon size={34} />
          </span>
          <h1 className={`text-fluid-2xl font-bold ${meta.text}`}>{t(`statusPage.status.${status}`)}</h1>
          <p className="max-w-xs text-fluid-xs leading-relaxed text-ink-soft">
            {t(`statusPage.statusHint.${status}`)}
          </p>
        </div>

        {/* Details */}
        <dl className="px-6 py-5 sm:px-8">
          <Row label={t("confirmation.name")} value={booking.name} />
          <Row label={t("confirmation.phone")} value={booking.phone} ltr />
          <Row label={t("confirmation.guests")} value={localizeDigits(booking.guest_count, locale)} />
          <Row
            label={t("confirmation.visitorType")}
            value={t(`form.visitorTypes.${booking.visitor_type}`)}
          />
          <Row label={t("confirmation.date")} value={dateLabel} />
          {booking.note && (
            <Row
              label={t("confirmation.note")}
              value={<span className="whitespace-pre-wrap">{booking.note}</span>}
            />
          )}
        </dl>

        <div className="border-t border-ink/5 px-6 py-4 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-fluid-xs font-medium text-ink-faint transition-colors hover:text-ink"
          >
            <BackArrow size={14} />
            {t("statusPage.backHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
