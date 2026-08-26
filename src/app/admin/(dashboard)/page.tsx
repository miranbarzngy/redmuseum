import Link from "next/link";
import { CalendarClock, Images, UserRound, BookOpen, Inbox } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { getUnreadMessageCount } from "./messages/actions";
import { getVisitStats } from "./getVisitStats";
import { AnalyticsSection } from "./AnalyticsSection";

async function getCounts() {
  const supabase = createClient();
  const [exhibitions, gallery, profile, biographyBlocks, unreadMessages] = await Promise.all([
    supabase.from("exhibitions").select("*", { count: "exact", head: true }),
    supabase.from("gallery").select("*", { count: "exact", head: true }),
    supabase.from("site_profile").select("id").eq("id", 1).maybeSingle(),
    supabase.from("biography_blocks").select("*", { count: "exact", head: true }),
    getUnreadMessageCount(),
  ]);

  return {
    exhibitions: exhibitions.count ?? 0,
    gallery: gallery.count ?? 0,
    profileConfigured: Boolean(profile.data),
    biographyBlocks: biographyBlocks.count ?? 0,
    unreadMessages,
  };
}

export default async function AdminOverviewPage() {
  const [counts, visitStats] = await Promise.all([getCounts(), getVisitStats()]);

  const cards = [
    {
      href: "/admin/profile",
      label: "پرۆفایلی پەڕەی سەرەکی",
      value: counts.profileConfigured ? "ڕێکخراوە" : "بەکارهێنانی بنەڕەتییەکان",
      icon: UserRound,
    },
    { href: "/admin/museums", label: "بەشەکانی مۆزەخانە", value: counts.biographyBlocks, icon: BookOpen },
    { href: "/admin/exhibitions", label: "پێشانگاکان", value: counts.exhibitions, icon: CalendarClock },
    { href: "/admin/gallery", label: "گەلەری", value: counts.gallery, icon: Images },
    { href: "/admin/messages", label: "پەیامی نەخوێندراوە", value: counts.unreadMessages, icon: Inbox },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">گشتی</h1>
        <p className="font-kurdish mt-1 text-fluid-sm text-ink-soft">
          بەڕێوەبردنی ناوەڕۆکی پیشاندراو لە ماڵپەڕی گشتیدا.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map(({ href, label, value, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="group flex flex-col gap-4 rounded-2xl border border-ink/10 bg-white/70 p-6 shadow-card backdrop-blur-md transition-all duration-300 hover:-translate-y-1 hover:border-pigment-terracotta/30 hover:shadow-soft"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas-paper text-pigment-terracotta transition-colors group-hover:bg-pigment-terracotta group-hover:text-canvas">
              <Icon size={18} />
            </span>
            <div>
              <div
                className={`font-kurdish ${typeof value === "number" ? "text-fluid-2xl font-semibold text-ink" : "text-fluid-lg font-semibold text-ink"}`}
              >
                {value}
              </div>
              <div className="font-kurdish text-fluid-sm text-ink-soft">{label}</div>
            </div>
          </Link>
        ))}
      </div>

      <AnalyticsSection stats={visitStats} />
    </div>
  );
}
