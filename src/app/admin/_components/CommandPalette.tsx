"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import clsx from "clsx";
import { CornerDownLeft, Search } from "lucide-react";
import type { NavItem } from "./adminNav";
import { startNavigationProgress } from "./NavigationProgress";

type Entry = NavItem & { kind: "section" | "action" };

/** Lower-cases and folds the Arabic-script letter variants people type
 * interchangeably (ي/ی, ك/ک, ه/ە…) so a query matches however it's typed. */
function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[هة]/g, "ە")
    .replace(/‌/g, "")
    .trim();
}

/**
 * Jump-anywhere launcher: every section and quick action the role can open,
 * filtered as you type. Opened from the top bar's search button, Ctrl/⌘+K,
 * or "/" (when not already typing somewhere). Arrow keys move, Enter goes.
 * The highlighted destination is prefetched, so Enter lands on it at once.
 */
export function CommandPalette({
  open,
  onClose,
  sections,
  actions,
}: {
  open: boolean;
  onClose: () => void;
  sections: NavItem[];
  actions: NavItem[];
}) {
  if (!open) return null;
  return <PalettePanel onClose={onClose} sections={sections} actions={actions} />;
}

function PalettePanel({
  onClose,
  sections,
  actions,
}: {
  onClose: () => void;
  sections: NavItem[];
  actions: NavItem[];
}) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [query, setQuery] = useState("");
  const [index, setIndex] = useState(0);

  const entries = useMemo<Entry[]>(() => {
    const all: Entry[] = [
      ...sections.map((s) => ({ ...s, kind: "section" as const })),
      ...actions.map((a) => ({ ...a, kind: "action" as const })),
    ];
    const needle = normalize(query);
    if (!needle) return all;
    return all.filter((e) => normalize(`${e.label} ${e.keywords ?? ""}`).includes(needle));
  }, [sections, actions, query]);

  const active = entries[Math.min(index, entries.length - 1)];

  useEffect(() => {
    inputRef.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, []);

  useEffect(() => {
    if (active) router.prefetch(active.href);
    listRef.current
      ?.querySelector<HTMLElement>('[data-active="true"]')
      ?.scrollIntoView({ block: "nearest" });
  }, [active, router]);

  function go(entry: Entry | undefined) {
    if (!entry) return;
    onClose();
    startNavigationProgress(entry.href);
    router.push(entry.href);
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setIndex((i) => (entries.length === 0 ? 0 : (Math.min(i, entries.length - 1) + 1) % entries.length));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setIndex((i) =>
        entries.length === 0 ? 0 : (Math.min(i, entries.length - 1) - 1 + entries.length) % entries.length,
      );
    } else if (e.key === "Enter") {
      e.preventDefault();
      go(active);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  }

  return (
    <div
      className="fixed inset-0 z-[80] flex items-start justify-center px-3 pt-[calc(env(safe-area-inset-top)+0.75rem)] sm:pt-[12vh]"
      onKeyDown={onKeyDown}
    >
      <div aria-hidden onClick={onClose} className="absolute inset-0 animate-overlay-in bg-ink/45 backdrop-blur-[2px]" />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="گەڕانی خێرا"
        className="relative flex max-h-[min(70vh,520px)] w-full max-w-lg animate-modal-in flex-col overflow-hidden rounded-3xl bg-white shadow-soft"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-ink/10 px-4">
          <Search size={18} className="shrink-0 text-ink-faint" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            placeholder="بڕۆ بۆ بەشێک یان کردارێک…"
            aria-label="گەڕانی خێرا"
            enterKeyHint="go"
            className="font-kurdish h-14 min-w-0 flex-1 bg-transparent text-base text-ink outline-none placeholder:text-ink-faint"
          />
          <kbd className="hidden shrink-0 rounded-md border border-ink/15 px-1.5 py-0.5 font-sans text-[10px] text-ink-faint sm:inline-block">
            Esc
          </kbd>
        </div>

        <ul ref={listRef} role="listbox" className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-2">
          {entries.length === 0 && (
            <li className="font-kurdish px-3 py-10 text-center text-fluid-sm text-ink-faint">هیچ ئەنجامێک نییە.</li>
          )}
          {entries.map((entry, i) => {
            const Icon = entry.icon;
            const isActive = entry === active;
            const startsGroup = i === 0 || entries[i - 1].kind !== entry.kind;
            return (
              <li key={`${entry.kind}-${entry.href}`} role="presentation">
                {startsGroup && (
                  <p className="font-kurdish px-3 pb-1 pt-2 text-[11px] font-medium text-ink-faint">
                    {entry.kind === "section" ? "بەشەکان" : "کردارە خێراکان"}
                  </p>
                )}
                <button
                  type="button"
                  role="option"
                  aria-selected={isActive}
                  data-active={isActive}
                  onClick={() => go(entry)}
                  onMouseMove={() => setIndex(i)}
                  className={clsx(
                    "font-kurdish flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-start text-fluid-sm transition-colors active:scale-[0.99]",
                    isActive ? "bg-[#850B10]/[0.08] text-ink" : "text-ink-soft",
                  )}
                >
                  <span
                    className={clsx(
                      "flex h-9 w-9 shrink-0 items-center justify-center rounded-xl",
                      isActive ? "bg-[#850B10] text-white" : "bg-canvas-paper text-ink-soft",
                    )}
                  >
                    <Icon size={17} />
                  </span>
                  <span className="min-w-0 flex-1 truncate font-medium">{entry.label}</span>
                  {isActive && <CornerDownLeft size={14} className="hidden shrink-0 text-ink-faint sm:block" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

/** Ctrl/⌘+K anywhere, or "/" when focus isn't in a text field. */
export function usePaletteShortcut(openPalette: () => void) {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        openPalette();
        return;
      }
      if (e.key !== "/" || e.ctrlKey || e.metaKey || e.altKey) return;
      const el = document.activeElement;
      const typing =
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement ||
        (el instanceof HTMLElement && el.isContentEditable);
      if (typing || document.body.style.overflow === "hidden") return;
      e.preventDefault();
      openPalette();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openPalette]);
}
