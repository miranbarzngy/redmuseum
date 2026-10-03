import Link from "next/link";
import clsx from "clsx";
import { ChevronLeft, Inbox, Ticket } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { NavItem } from "../_components/adminNav";

/** The overview's "home screen" top: a count tile per inbox the role can
 * open (tap to jump straight in) — `null` hides that tile. */
export function HomeSummary({
  pendingBookings,
  unreadMessages,
}: {
  pendingBookings: number | null;
  unreadMessages: number | null;
}) {
  if (pendingBookings === null && unreadMessages === null) return null;
  return (
    <div className={clsx("grid gap-3 sm:gap-4", pendingBookings !== null && unreadMessages !== null && "grid-cols-2")}>
      {pendingBookings !== null && (
        <SummaryTile
          href="/admin/bookings"
          icon={Ticket}
          count={pendingBookings}
          label="سەردانی چاوەڕوان"
          iconClassName="bg-gold-fill text-[#3B2A00] shadow-[0_6px_14px_-6px_rgba(194,154,36,0.7)]"
        />
      )}
      {unreadMessages !== null && (
        <SummaryTile
          href="/admin/messages"
          icon={Inbox}
          count={unreadMessages}
          label="پەیامی نەخوێندراو"
          iconClassName="bg-brand-fill text-white shadow-brand"
        />
      )}
    </div>
  );
}

function SummaryTile({
  href,
  icon: Icon,
  count,
  label,
  iconClassName,
}: {
  href: string;
  icon: LucideIcon;
  count: number;
  label: string;
  iconClassName: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col gap-4 rounded-[1.375rem] border border-ink/[0.07] bg-white p-4 shadow-card transition-transform duration-200 ease-out active:scale-[0.97] sm:p-5"
    >
      <span className="flex items-center justify-between">
        <span className={clsx("flex h-10 w-10 items-center justify-center rounded-xl", iconClassName)}>
          <Icon size={19} />
        </span>
        <ChevronLeft size={18} className="text-ink-faint" />
      </span>
      <span>
        <span className="font-kurdish block text-fluid-2xl font-semibold leading-none tabular-nums text-ink">{count}</span>
        <span className="font-kurdish mt-1.5 block text-fluid-xs text-ink-soft">{label}</span>
      </span>
    </Link>
  );
}

/** App-style shortcut tiles for the everyday jumps (see QUICK_ACTIONS) —
 * one swipeable row on phones, a grid from `sm` up. */
export function QuickActionTiles({ actions }: { actions: NavItem[] }) {
  if (actions.length === 0) return null;
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-kurdish text-fluid-sm font-semibold text-ink">کورتەڕێگاکان</h2>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:grid sm:grid-cols-3 sm:overflow-visible sm:px-0 lg:grid-cols-6">
        {actions.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className="font-kurdish flex w-[6.5rem] shrink-0 flex-col items-center gap-2.5 rounded-[1.375rem] border border-ink/[0.05] bg-white px-2 py-4 text-center text-fluid-xs font-medium text-ink-soft shadow-card transition-[colors,transform] duration-200 ease-out hover:text-ink active:scale-95 sm:w-auto"
          >
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-b from-brand/[0.15] to-brand/[0.06] text-brand ring-1 ring-inset ring-brand/10">
              <Icon size={20} />
            </span>
            <span className="leading-tight">{label}</span>
          </Link>
        ))}
      </div>
    </section>
  );
}
