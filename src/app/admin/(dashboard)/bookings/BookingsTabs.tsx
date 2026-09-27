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

export function BookingsTabs() {
  const pathname = usePathname();

  return (
    <div className="no-scrollbar -mx-4 flex items-center gap-2 overflow-x-auto border-b border-ink/10 px-4 pb-3 sm:mx-0 sm:flex-wrap sm:overflow-visible sm:px-0">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "font-kurdish inline-flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 py-2 text-fluid-xs font-medium transition-[colors,transform] duration-150 active:scale-95",
              active
                ? "bg-[#850B10] text-canvas"
                : "border border-ink/15 text-ink-soft hover:border-pigment-terracotta hover:text-pigment-terracotta"
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
