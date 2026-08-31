"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Ticket, CalendarCog } from "lucide-react";
import clsx from "clsx";

const TABS = [
  { href: "/admin/bookings", label: "سەردانەکان", icon: Ticket, exact: true },
  { href: "/admin/bookings/schedule", label: "خشتەی سەردان", icon: CalendarCog, exact: false },
];

export function BookingsTabs() {
  const pathname = usePathname();

  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-ink/10 pb-3">
      {TABS.map(({ href, label, icon: Icon, exact }) => {
        const active = exact ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              "font-kurdish inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-fluid-xs font-medium transition-colors",
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
