import Link from "next/link";
import { CalendarClock, Images, UserRound, BookOpen, Tags } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getMessages } from "./messages/actions";
import { getBookings } from "./bookings/actions";
import { formatMessageDate } from "./messages/formatMessageDate";
import { formatVisitDate } from "./bookings/formatBookingDate";
import { getVisitStats } from "./getVisitStats";
import { AnalyticsSection } from "./AnalyticsSection";
import { PageHeader } from "../_components/PageHeader";
import { Panel } from "../_components/Panel";
import { LinkButton } from "../_components/Button";
import { StatusBadge } from "../_components/StatusBadge";

async function getContentCounts() {
  const supabase = createClient();
  const [exhibitions, gallery, categories, blocks, profile] = await Promise.all([
    supabase.from("exhibitions").select("*", { count: "exact", head: true }),
    supabase.from("gallery").select("*", { count: "exact", head: true }),
    supabase.from("gallery_categories").select("*", { count: "exact", head: true }),
    supabase.from("biography_blocks").select("*", { count: "exact", head: true }),
    supabase.from("site_profile").select("id").eq("id", 1).maybeSingle(),
  ]);
  return {
    exhibitions: exhibitions.count ?? 0,
    gallery: gallery.count ?? 0,
    categories: categories.count ?? 0,
    blocks: blocks.count ?? 0,
    profileConfigured: Boolean(profile.data),
  };
}

export default async function AdminOverviewPage() {
  const [counts, visitStats, bookings, messages] = await Promise.all([
    getContentCounts(),
    getVisitStats(),
    getBookings(),
    getMessages(),
  ]);

  const pending = bookings.filter((b) => b.status === "pending");
  const unread = messages.filter((m) => !m.is_read);

  const quickActions = [
    { href: "/admin/museums/blocks/new", label: "زیادکردنی بەش", icon: BookOpen },
    { href: "/admin/museumhistory/new", label: "زیادکردنی ڕووداو", icon: CalendarClock },
    { href: "/admin/gallery/new", label: "زیادکردنی وێنە", icon: Images },
    { href: "/admin/profile", label: "دەستکاری پرۆفایل", icon: UserRound },
  ];

  const healthTiles = [
    {
      href: "/admin/profile",
      label: "پرۆفایل",
      icon: UserRound,
      node: counts.profileConfigured ? (
        <StatusBadge tone="positive">ڕێکخراوە</StatusBadge>
      ) : (
        <StatusBadge tone="muted">بنەڕەتی</StatusBadge>
      ),
    },
    { href: "/admin/museums", label: "بەشەکان", icon: BookOpen, value: counts.blocks },
    { href: "/admin/museumhistory", label: "مێژووی مۆزەخانە", icon: CalendarClock, value: counts.exhibitions },
    { href: "/admin/gallery", label: "گەلەری", icon: Images, value: counts.gallery },
    { href: "/admin/gallery-categories", label: "پۆلەکان", icon: Tags, value: counts.categories },
  ];

  return (
    <div className="flex flex-col gap-8">
      <PageHeader title="گشتی" description="بەڕێوەبردنی ناوەڕۆکی پیشاندراو لە ماڵپەڕی گشتیدا." />

      <div className="flex flex-wrap gap-2.5">
        {quickActions.map(({ href, label, icon: Icon }) => (
          <LinkButton key={href} href={href} variant="secondary">
            <Icon size={15} /> {label}
          </LinkButton>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Panel
          title="سەردانی چاوەڕوان"
          description={pending.length > 0 ? `${pending.length} داواکاری چاوەڕوانی پشتڕاستکردنەوەیە` : undefined}
          action={
            <Link
              href="/admin/bookings"
              className="font-kurdish text-fluid-xs font-medium text-pigment-terracotta hover:underline"
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
                className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-canvas-paper"
              >
                <span className="truncate text-fluid-sm text-ink">{b.name}</span>
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
              className="font-kurdish text-fluid-xs font-medium text-pigment-terracotta hover:underline"
            >
              هەموو
            </Link>
          }
          bodyClassName="flex flex-col gap-1"
        >
          {unread.length === 0 ? (
            <p className="font-kurdish text-fluid-xs text-ink-faint">هەموو پەیامەکان خوێندراونەتەوە.</p>
          ) : (
            unread.slice(0, 4).map((m) => (
              <Link
                key={m.id}
                href={`/admin/messages/${m.id}`}
                className="flex items-center justify-between gap-3 rounded-xl px-2 py-1.5 transition-colors hover:bg-canvas-paper"
              >
                <span className="truncate text-fluid-sm text-ink">{m.name}</span>
                <span className="shrink-0 text-fluid-xs text-ink-faint">
                  {formatMessageDate(m.created_at)}
                </span>
              </Link>
            ))
          )}
        </Panel>
      </div>

      <div>
        <h2 className="font-kurdish mb-3 text-fluid-lg font-semibold text-ink">تەندروستی ناوەڕۆک</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {healthTiles.map(({ href, label, icon: Icon, value, node }) => (
            <Link
              key={href}
              href={href}
              className="group flex flex-col gap-3 rounded-2xl border border-ink/10 bg-white p-4 shadow-card transition-all hover:-translate-y-0.5 hover:border-pigment-terracotta/30"
            >
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-canvas-paper text-pigment-terracotta transition-colors group-hover:bg-pigment-terracotta group-hover:text-canvas">
                <Icon size={16} />
              </span>
              <div>
                {node ?? (
                  <div className="font-kurdish text-fluid-2xl font-semibold text-ink">{value}</div>
                )}
                <div className="font-kurdish mt-1 text-fluid-xs text-ink-soft">{label}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <AnalyticsSection stats={visitStats} />
    </div>
  );
}
