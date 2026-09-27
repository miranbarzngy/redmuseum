import { InlineBackLink, LargeTitle } from "./pageChrome";

/**
 * The one header every admin page/edit page uses: optional back link (points
 * physically right — "back" in this permanently-RTL panel), title,
 * description, and an actions slot on the opposite edge.
 *
 * The title is a native-style "large title": on phones it also drives the
 * top bar (see pageChrome.tsx), which picks up the title once it scrolls
 * away and shows `backHref` as a back button in its leading corner.
 */
export function PageHeader({
  title,
  description,
  backHref,
  backLabel = "گەڕانەوە",
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      {backHref && <InlineBackLink href={backHref} label={backLabel} />}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <LargeTitle
            title={title}
            backHref={backHref}
            className="font-kurdish text-[1.65rem] font-semibold leading-tight text-ink lg:text-fluid-xl"
          />
          {description && (
            <p className="font-kurdish mt-1.5 text-fluid-sm text-ink-soft">{description}</p>
          )}
        </div>
        {children && <div className="flex flex-wrap items-center gap-2.5">{children}</div>}
      </div>
    </div>
  );
}
