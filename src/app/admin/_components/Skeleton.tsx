import clsx from "clsx";

// Loading placeholders for the routes' loading.tsx files. Next prefetches a
// dynamic route only up to its loading.tsx, so with these in place a tap
// switches to the destination's skeleton instantly and the real content
// streams into it — instead of the old tap, wait, then jump. Each shape
// roughly mirrors the page it stands in for, so the swap doesn't jolt.

// A soft highlight sweeps across each bone instead of the whole shape
// blinking — the native skeleton look. Reduced motion stops the sweep
// (globals.css), leaving a still gray bone.
function Bone({ className }: { className?: string }) {
  return (
    <div
      className={clsx(
        "relative overflow-hidden rounded-xl bg-ink/[0.06] after:absolute after:inset-0 after:animate-shimmer after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent",
        className
      )}
    />
  );
}

function Frame({ narrow, children }: { narrow?: "2xl" | "3xl"; children: React.ReactNode }) {
  return (
    <div
      role="status"
      aria-busy="true"
      className={clsx(
        "flex flex-col gap-6",
        narrow === "2xl" && "mx-auto max-w-2xl",
        narrow === "3xl" && "mx-auto max-w-3xl",
      )}
    >
      <span className="sr-only">بارکردن…</span>
      {children}
    </div>
  );
}

function HeaderBones({ action }: { action?: boolean }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 flex-col gap-2.5">
        <Bone className="h-8 w-44" />
        <Bone className="h-4 w-72 max-w-[80vw]" />
      </div>
      {action && <Bone className="h-10 w-36 rounded-full" />}
    </div>
  );
}

function ChipBones({ count = 4 }: { count?: number }) {
  return (
    <div className="flex gap-2 overflow-hidden">
      {Array.from({ length: count }, (_, i) => (
        <Bone key={i} className={clsx("h-9 shrink-0 rounded-full", i === 0 ? "w-24" : "w-20")} />
      ))}
    </div>
  );
}

function RowBones({ rows = 6, avatar = true }: { rows?: number; avatar?: boolean }) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }, (_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl border border-ink/5 bg-white p-3.5 shadow-card">
          {avatar && <Bone className="h-12 w-12 shrink-0 rounded-full" />}
          <div className="flex min-w-0 flex-1 flex-col gap-2">
            <Bone className="h-4 w-2/5" />
            <Bone className="h-3 w-3/5" />
          </div>
          <Bone className="hidden h-9 w-9 shrink-0 rounded-full sm:block" />
        </div>
      ))}
    </div>
  );
}

/** Rows of avatar + two lines — users, categories, audit log, etc. */
export function ListSkeleton({ tabs, chips, rows }: { tabs?: boolean; chips?: boolean; rows?: number }) {
  return (
    <Frame>
      <HeaderBones />
      {tabs && <ChipBones count={3} />}
      {chips && <ChipBones />}
      <RowBones rows={rows} />
    </Frame>
  );
}

/** Image-card grid — gallery, museum sections, history events. */
export function GridSkeleton({ chips, tabs }: { chips?: boolean; tabs?: boolean }) {
  return (
    <Frame>
      <HeaderBones action={chips} />
      {tabs && <ChipBones count={3} />}
      {chips && <ChipBones />}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-ink/5 bg-white shadow-card">
            <Bone className="aspect-[4/3] w-full rounded-none" />
            <div className="flex flex-col gap-2 p-3">
              <Bone className="h-4 w-3/4" />
              <Bone className="h-3 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </Frame>
  );
}

/** Create / edit / settings forms: a card of label + field pairs. */
export function FormSkeleton({
  narrow = "3xl",
  tabs,
  back = true,
}: {
  narrow?: "2xl" | "3xl" | "none";
  tabs?: boolean;
  back?: boolean;
}) {
  return (
    <Frame narrow={narrow === "none" ? undefined : narrow}>
      {back && <Bone className="hidden h-4 w-28 lg:block" />}
      <HeaderBones />
      {tabs && <ChipBones count={3} />}
      <div className="flex flex-col gap-5 rounded-2xl border border-ink/5 bg-white p-5 shadow-card sm:p-6">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="flex flex-col gap-2">
            <Bone className="h-3.5 w-24" />
            <Bone className={clsx("w-full", i === 2 ? "h-24" : "h-11")} />
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Bone className="h-11 w-44 rounded-full" />
      </div>
    </Frame>
  );
}

/** Messages inbox: tabs + search, then message cards. */
export function InboxSkeleton() {
  return (
    <Frame>
      <HeaderBones action />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <ChipBones count={3} />
        <Bone className="h-11 w-full sm:w-72" />
      </div>
      <RowBones rows={5} />
    </Frame>
  );
}

/** Bookings: section tabs, the six status tiles, search, then rows. */
export function BookingsSkeleton() {
  return (
    <Frame>
      <HeaderBones />
      <ChipBones count={3} />
      <div className="grid grid-cols-3 gap-1.5 sm:gap-2 lg:grid-cols-6">
        {Array.from({ length: 6 }, (_, i) => (
          <Bone key={i} className="h-[5.25rem] rounded-xl" />
        ))}
      </div>
      <Bone className="h-10 w-full sm:max-w-xs" />
      <RowBones rows={5} />
    </Frame>
  );
}

/** Overview: summary tiles, shortcuts, the two inbox panels, stats. */
export function DashboardSkeleton() {
  return (
    <Frame>
      <HeaderBones />
      <div className="grid grid-cols-2 gap-3">
        <Bone className="h-24 rounded-2xl" />
        <Bone className="h-24 rounded-2xl" />
      </div>
      <div className="flex gap-3 overflow-hidden">
        {Array.from({ length: 4 }, (_, i) => (
          <Bone key={i} className="h-24 w-24 shrink-0 rounded-2xl" />
        ))}
      </div>
      <div className="grid gap-6 md:grid-cols-2">
        <Bone className="h-48 rounded-2xl" />
        <Bone className="h-48 rounded-2xl" />
      </div>
    </Frame>
  );
}
