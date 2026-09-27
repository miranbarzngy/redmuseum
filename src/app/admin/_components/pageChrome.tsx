"use client";

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import clsx from "clsx";
import { ArrowRight } from "lucide-react";
import { useIsNativeApp } from "@/lib/useIsNativeApp";

// Lets the page's own <h1> drive AdminShell's phone top bar the way a native
// "large title" screen does: while the big title is on screen the bar shows
// just the brand, and once it scrolls up under the bar the bar takes over
// the title in compact form. Sub-pages also hand the bar their back link so
// it sits in the bar's leading corner like a native back button.

type PageChrome = {
  /** The current page's title, once its <LargeTitle> has mounted. */
  title: string | null;
  /** True once the large title has scrolled up under the top bar. */
  titleScrolledAway: boolean;
  backHref: string | null;
};

type PageChromeSetters = {
  setTitle: (title: string | null) => void;
  setTitleScrolledAway: (hidden: boolean) => void;
  setBackHref: (href: string | null) => void;
};

const EMPTY: PageChrome = { title: null, titleScrolledAway: false, backHref: null };

const StateContext = createContext<PageChrome>(EMPTY);
const SetterContext = createContext<PageChromeSetters | null>(null);

export function PageChromeProvider({ children }: { children: React.ReactNode }) {
  const [title, setTitle] = useState<string | null>(null);
  const [titleScrolledAway, setTitleScrolledAway] = useState(false);
  const [backHref, setBackHref] = useState<string | null>(null);

  const state = useMemo(() => ({ title, titleScrolledAway, backHref }), [title, titleScrolledAway, backHref]);
  // State setters are stable, so this object never changes and <LargeTitle>'s
  // effect doesn't re-run on every scroll update.
  const setters = useMemo(() => ({ setTitle, setTitleScrolledAway, setBackHref }), []);

  return (
    <SetterContext.Provider value={setters}>
      <StateContext.Provider value={state}>{children}</StateContext.Provider>
    </SetterContext.Provider>
  );
}

export function usePageChrome(): PageChrome {
  return useContext(StateContext);
}

// How far down from the viewport top the title has to clear before it
// counts as "under the bar" — roughly the top bar's own height.
const TOP_BAR_OFFSET_PX = 64;

/** The page <h1>. Reports its text, its back link and whether it has
 * scrolled under the top bar to AdminShell. Rendered by PageHeader. */
export function LargeTitle({
  title,
  backHref,
  className,
}: {
  title: string;
  backHref?: string;
  className?: string;
}) {
  const ref = useRef<HTMLHeadingElement>(null);
  const setters = useContext(SetterContext);

  useEffect(() => {
    if (!setters) return;
    setters.setTitle(title);
    setters.setBackHref(backHref ?? null);
    return () => {
      setters.setTitle(null);
      setters.setBackHref(null);
    };
  }, [setters, title, backHref]);

  useEffect(() => {
    const el = ref.current;
    if (!setters || !el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setters.setTitleScrolledAway(!entry.isIntersecting),
      { rootMargin: `-${TOP_BAR_OFFSET_PX}px 0px 0px 0px` },
    );
    observer.observe(el);
    return () => {
      observer.disconnect();
      setters.setTitleScrolledAway(false);
    };
  }, [setters]);

  return (
    <h1 ref={ref} className={className}>
      {title}
    </h1>
  );
}

/** PageHeader's text back link — only for the desktop sidebar layout. With
 * the bottom nav (phones, and always in the native APK) the same link lives
 * in the top bar instead, so this one stays hidden there. */
export function InlineBackLink({ href, label }: { href: string; label: string }) {
  const forceBottomNav = useIsNativeApp();
  return (
    <Link
      href={href}
      className={clsx(
        "font-kurdish hidden w-fit items-center gap-1.5 text-fluid-xs font-medium text-ink-soft transition-colors hover:text-pigment-terracotta",
        !forceBottomNav && "lg:inline-flex",
      )}
    >
      <ArrowRight size={15} /> {label}
    </Link>
  );
}
