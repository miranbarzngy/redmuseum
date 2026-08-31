"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import clsx from "clsx";

type ToastKind = "success" | "error";
type ToastItem = { id: number; kind: ToastKind; message: string };

type ToastCtx = { show: (message: string, kind?: ToastKind) => void };
const Context = createContext<ToastCtx | null>(null);

export function useToast(): ToastCtx {
  const ctx = useContext(Context);
  if (!ctx) throw new Error("useToast must be used inside <ToastProvider>");
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const seq = useRef(0);

  const show = useCallback((message: string, kind: ToastKind = "success") => {
    const id = ++seq.current;
    setItems((prev) => [...prev, { id, kind, message }]);
    setTimeout(() => setItems((prev) => prev.filter((t) => t.id !== id)), 4000);
  }, []);

  const dismiss = (id: number) => setItems((prev) => prev.filter((t) => t.id !== id));

  return (
    <Context.Provider value={{ show }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {items.map((t) => (
          <div
            key={t.id}
            className={clsx(
              "pointer-events-auto flex items-center gap-2.5 rounded-full border bg-white/95 px-4 py-2.5 shadow-soft backdrop-blur-md",
              t.kind === "success"
                ? "border-pigment-teal/20 text-pigment-teal"
                : "border-pigment-crimson/20 text-pigment-crimson"
            )}
          >
            {t.kind === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
            <span className="font-kurdish text-fluid-sm">{t.message}</span>
            <button
              type="button"
              onClick={() => dismiss(t.id)}
              aria-label="داخستن"
              className="text-ink-faint transition-colors hover:text-ink"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </Context.Provider>
  );
}

const TOAST_MESSAGES: Record<string, string> = {
  "1": "پاشەکەوت کرا.",
  saved: "پاشەکەوت کرا.",
  created: "بە سەرکەوتوویی زیادکرا.",
  deleted: "سڕایەوە.",
};

/**
 * Reads `?saved=1` / `?toast=<key>` left by a server-action redirect, shows a
 * toast once, then strips the param so a refresh doesn't replay it. Mounted
 * once, inside <ToastProvider>, under a Suspense boundary (useSearchParams).
 */
export function FlashToast() {
  const params = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { show } = useToast();
  const firedFor = useRef<string | null>(null);

  const key = params.get("saved") ?? params.get("toast");

  useEffect(() => {
    if (!key || firedFor.current === key) return;
    firedFor.current = key;
    show(TOAST_MESSAGES[key] ?? "پاشەکەوت کرا.");

    const next = new URLSearchParams(params);
    next.delete("saved");
    next.delete("toast");
    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [key, params, pathname, router, show]);

  return null;
}
