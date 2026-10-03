"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, CalendarCog, Tags } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/admin/bookings", label: "سەردانەکان", icon: Ticket, exact: true },
  { href: "/admin/bookings/schedule", label: "خشتەی سەردان", icon: CalendarCog, exact: false },
  { href: "/admin/bookings/categories", label: "جۆرەکانی سەردان", icon: Tags, exact: false },
];

/** Section tabs for the bookings area. Same look as the page's sliding
 * filter pills, but the active pill is static: each section is its own page
 * rendering its own copy of these tabs, so there is no persistent element
 * for a pill to slide across. */
export function BookingsTabs() {
  const pathname = usePathname();

  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto border-b border-ink/[0.07] px-4 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={clsx(
              "font-kurdish inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-fluid-xs font-medium transition-[color,background-color,box-shadow,transform] duration-300 ease-spring active:scale-95",
              active
                ? "bg-brand-fill text-white shadow-brand"
                : "bg-white/70 text-ink-soft shadow-[0_1px_2px_rgba(28,27,25,0.05)] ring-1 ring-inset ring-ink/10 backdrop-blur-sm hover:bg-white hover:text-ink"
            )}
          >
            <Icon size={14} />
            {label}
          </Link>
        );
      })}
    </div>
  );
}
