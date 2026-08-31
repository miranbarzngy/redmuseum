import clsx from "clsx";

/**
 * The shared mobile row/card: an optional leading slot (thumbnail or drag
 * handle), a title + meta stack, an optional badge row, and trailing
 * actions. Used as `renderCard` for DataList / SortableDataList and anywhere
 * a simple stacked list is enough.
 */
export function RowCard({
  leading,
  title,
  meta,
  badges,
  actions,
  className,
}: {
  leading?: React.ReactNode;
  title: React.ReactNode;
  meta?: React.ReactNode;
  badges?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "flex items-center gap-3 rounded-2xl border border-ink/10 bg-white p-3.5 shadow-card",
        className
      )}
    >
      {leading}
      <div className="min-w-0 flex-1">
        <div className="truncate text-fluid-sm font-medium text-ink">{title}</div>
        {meta && <div className="mt-0.5 truncate text-fluid-xs text-ink-faint">{meta}</div>}
        {badges && <div className="mt-1.5 flex flex-wrap items-center gap-1.5">{badges}</div>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-1.5">{actions}</div>}
    </div>
  );
}

/** Thumbnail box with the panel's paper background as fallback. `fit`
 * defaults to "cover"; pass "contain" to show the whole image (letterboxed
 * on the paper background) rather than cropping it. */
export function Thumb({
  src,
  className = "h-14 w-14",
  rounded = "rounded-xl",
  fit = "cover",
}: {
  src?: string | null;
  className?: string;
  rounded?: string;
  fit?: "cover" | "contain";
}) {
  return (
    <div className={clsx("shrink-0 overflow-hidden bg-canvas-paper", rounded, className)}>
      {src && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt=""
          className={clsx("h-full w-full", fit === "contain" ? "object-contain" : "object-cover")}
        />
      )}
    </div>
  );
}
