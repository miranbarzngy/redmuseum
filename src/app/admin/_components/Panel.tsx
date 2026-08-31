"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import clsx from "clsx";

/**
 * White bordered card with an optional header (title / description / action)
 * and an optional collapse toggle. Replaces the ad-hoc
 * `rounded-2xl border border-ink/10 bg-white p-6 shadow-card` repeated on
 * every admin page.
 *
 * It's a client component only so `collapsible` can hold open/closed state —
 * server-rendered children passed in as `children` still work fine.
 */
export function Panel({
  title,
  description,
  action,
  collapsible = false,
  defaultOpen = true,
  children,
  className,
  bodyClassName,
}: {
  title?: string;
  description?: string;
  action?: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  const hasHeader = Boolean(title || description || action || collapsible);

  return (
    <section
      className={clsx("rounded-2xl border border-ink/10 bg-white shadow-card", className)}
    >
      {hasHeader && (
        <div
          className={clsx(
            "flex flex-wrap items-start justify-between gap-3 px-5 py-4 sm:px-6",
            (!collapsible || open) && "border-b border-ink/10"
          )}
        >
          {collapsible ? (
            <button
              type="button"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              className="flex min-w-0 flex-1 cursor-pointer items-start gap-2 text-start"
            >
              <ChevronDown
                size={16}
                className={clsx(
                  "mt-0.5 shrink-0 text-ink-faint transition-transform",
                  open && "rotate-180"
                )}
              />
              <HeaderText title={title} description={description} />
            </button>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col">
              <HeaderText title={title} description={description} />
            </div>
          )}
          {action && <div className="flex items-center gap-2">{action}</div>}
        </div>
      )}
      {(!collapsible || open) && (
        <div className={clsx("p-5 sm:p-6", bodyClassName)}>{children}</div>
      )}
    </section>
  );
}

function HeaderText({ title, description }: { title?: string; description?: string }) {
  return (
    <span className="min-w-0">
      {title && (
        <span className="font-kurdish block text-fluid-base font-semibold text-ink">{title}</span>
      )}
      {description && (
        <span className="font-kurdish mt-0.5 block text-fluid-xs text-ink-faint">{description}</span>
      )}
    </span>
  );
}
