import type { LucideIcon } from "lucide-react";

/** Consistent "nothing here yet" block — icon, message, optional CTA. */
export function EmptyState({
  icon: Icon,
  title,
  description,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-ink/15 bg-white/50 px-6 py-12 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-canvas-paper text-ink-faint">
        <Icon size={20} />
      </span>
      <div>
        <p className="font-kurdish text-fluid-sm font-medium text-ink">{title}</p>
        {description && (
          <p className="font-kurdish mt-1 text-fluid-xs text-ink-faint">{description}</p>
        )}
      </div>
      {children}
    </div>
  );
}
