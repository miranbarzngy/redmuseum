"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Loader2,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Smartphone,
} from "lucide-react";
import type { PluginListenerHandle } from "@capacitor/core";
import { Panel } from "../../_components/Panel";
import { btnPrimary, btnSecondary } from "../../_components/Button";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import {
  ApkUpdater,
  checkForAppUpdate,
  type AppUpdateCheck,
} from "@/lib/nativeAppUpdate";

// The version check is one axis; the install action is another. Keeping them
// apart means "retry" from a blocked / failed state still knows which
// release it was trying to install.
type Action =
  | { kind: "idle" }
  | { kind: "downloading"; progress: number }
  | { kind: "launching" }
  | { kind: "blocked" }
  | { kind: "failed"; message: string };

export function AppUpdatePanel() {
  const isNative = useIsNativeApp();

  return (
    <Panel
      title="نوێکردنەوەی ئەپ"
      description="وەشانی نوێی ئەپی ئەندرۆید دابگرە بەبێ دووبارە دامەزراندنی دەستی."
    >
      {isNative ? (
        <NativeUpdater />
      ) : (
        <p className="font-kurdish flex items-center gap-2 text-fluid-xs text-ink-faint">
          <Smartphone size={15} className="shrink-0" />
          ئەم تایبەتمەندییە تەنها لەناو ئەپی ئەندرۆیددا کاردەکات.
        </p>
      )}
    </Panel>
  );
}

function NativeUpdater() {
  const [check, setCheck] = useState<AppUpdateCheck | null>(null);
  const [action, setAction] = useState<Action>({ kind: "idle" });
  const progressHandle = useRef<PluginListenerHandle | null>(null);

  const runCheck = useCallback(async () => {
    setCheck(null);
    setAction({ kind: "idle" });
    setCheck(await checkForAppUpdate());
  }, []);

  useEffect(() => {
    let cancelled = false;
    checkForAppUpdate().then((result) => {
      if (!cancelled) setCheck(result);
    });
    return () => {
      cancelled = true;
      progressHandle.current?.remove();
    };
  }, []);

  const startUpdate = useCallback(async () => {
    if (check?.state !== "available") return;
    const { apkUrl } = check.latest;

    try {
      const { granted } = await ApkUpdater.canInstall();
      if (!granted) {
        setAction({ kind: "blocked" });
        return;
      }

      setAction({ kind: "downloading", progress: 0 });
      progressHandle.current = await ApkUpdater.addListener(
        "downloadProgress",
        ({ progress, totalBytes }) => {
          setAction({
            kind: "downloading",
            progress: totalBytes > 0 ? progress : -1,
          });
        },
      );

      await ApkUpdater.downloadAndInstall({ url: apkUrl });
      setAction({ kind: "launching" });
    } catch (err) {
      setAction({
        kind: "failed",
        message: err instanceof Error ? err.message : String(err),
      });
    } finally {
      progressHandle.current?.remove();
      progressHandle.current = null;
    }
  }, [check]);

  const openSettings = useCallback(() => ApkUpdater.openInstallSettings(), []);

  // --- Install action in progress: it owns the whole body ---

  if (action.kind === "downloading") {
    const pct = action.progress < 0 ? null : Math.round(action.progress * 100);
    return (
      <div className="flex flex-col gap-3">
        <Row icon={<Download size={16} className="text-pigment-terracotta" />}>
          <span className="font-kurdish text-fluid-sm text-ink-soft">
            {pct === null ? "داگرتن…" : `داگرتن… ${pct}%`}
          </span>
        </Row>
        <div className="h-2 w-full overflow-hidden rounded-full bg-ink/10">
          <div
            className="h-full rounded-full bg-pigment-terracotta transition-[width] duration-200"
            style={{ width: pct === null ? "40%" : `${pct}%` }}
          />
        </div>
      </div>
    );
  }

  if (action.kind === "launching") {
    return (
      <Row icon={<CheckCircle2 size={16} className="text-emerald-600" />}>
        <span className="font-kurdish text-fluid-sm text-ink-soft">
          داگرتن تەواو بوو — پەنجەرەی دامەزراندنی ئەندرۆید دەکرێتەوە. دوای
          دامەزراندن ئەپەکە بکەرەوە.
        </span>
      </Row>
    );
  }

  if (action.kind === "blocked") {
    return (
      <div className="flex flex-col gap-3">
        <Row icon={<AlertTriangle size={16} className="text-pigment-gold" />}>
          <span className="font-kurdish text-fluid-sm text-ink-soft">
            ئەندرۆید ڕێگە نادات بە دامەزراندنی ئەپ لەم سەرچاوەیە. لە
            ڕێکخستنەکاندا «ڕێگەدان لەم سەرچاوەیە» چالاک بکە، پاشان دووبارە
            هەوڵبدەرەوە.
          </span>
        </Row>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={openSettings} className={btnPrimary}>
            کردنەوەی ڕێکخستنەکان
          </button>
          <button type="button" onClick={startUpdate} className={btnSecondary}>
            <RefreshCw size={15} /> دووبارە هەوڵدان
          </button>
        </div>
      </div>
    );
  }

  if (action.kind === "failed") {
    return (
      <div className="flex flex-col gap-3">
        <Row icon={<AlertTriangle size={16} className="text-pigment-crimson" />}>
          <span className="font-kurdish text-fluid-sm text-ink-soft">
            نوێکردنەوە سەرکەوتوو نەبوو.
            <span className="mt-0.5 block break-all font-mono text-fluid-xs text-ink-faint">
              {action.message}
            </span>
          </span>
        </Row>
        <div>
          <button type="button" onClick={startUpdate} className={btnPrimary}>
            <RefreshCw size={15} /> دووبارە هەوڵدان
          </button>
        </div>
      </div>
    );
  }

  // --- action is idle: render whatever the version check found ---

  if (check === null) {
    return (
      <Row icon={<Loader2 size={16} className="animate-spin text-ink-faint" />}>
        <span className="font-kurdish text-fluid-sm text-ink-soft">
          پشکنین بۆ وەشانی نوێ…
        </span>
      </Row>
    );
  }

  if (check.state === "available") {
    return (
      <div className="flex flex-col gap-3">
        <Row icon={<Download size={16} className="text-pigment-terracotta" />}>
          <span className="font-kurdish text-fluid-sm text-ink">
            وەشانی نوێ بەردەستە
            <span className="mt-0.5 block text-fluid-xs text-ink-faint">
              وەشانی ئێستا {check.installedVersionName} → وەشانی نوێ{" "}
              {check.latest.versionName ?? check.latest.versionCode}
            </span>
            {check.latest.notes && (
              <span className="mt-1 block text-fluid-xs text-ink-soft">
                {check.latest.notes}
              </span>
            )}
          </span>
        </Row>
        <div>
          <button type="button" onClick={startUpdate} className={btnPrimary}>
            <Download size={15} /> نوێکردنەوە ئێستا
          </button>
        </div>
      </div>
    );
  }

  if (check.state === "current") {
    return (
      <Row icon={<CheckCircle2 size={16} className="text-emerald-600" />}>
        <span className="font-kurdish text-fluid-sm text-ink-soft">
          نوێترین وەشانت هەیە ({check.installedVersionName}).
          <button
            type="button"
            onClick={runCheck}
            className="font-kurdish mr-2 text-fluid-xs font-medium text-pigment-terracotta underline"
          >
            پشکنینەوە
          </button>
        </span>
      </Row>
    );
  }

  if (check.state === "not-configured") {
    return (
      <Row icon={<Smartphone size={15} className="text-ink-faint" />}>
        <span className="font-kurdish text-fluid-xs text-ink-faint">
          هێشتا هیچ وەشانێکی نوێ بڵاو نەکراوەتەوە.
        </span>
      </Row>
    );
  }

  // check.state === "error"
  return (
    <div className="flex flex-col gap-3">
      <Row icon={<AlertTriangle size={16} className="text-pigment-crimson" />}>
        <span className="font-kurdish text-fluid-sm text-ink-soft">
          نەتوانرا پشکنین بکرێت بۆ وەشانی نوێ.
          <span className="mt-0.5 block break-all font-mono text-fluid-xs text-ink-faint">
            {check.message}
          </span>
        </span>
      </Row>
      <div>
        <button type="button" onClick={runCheck} className={btnSecondary}>
          <RefreshCw size={15} /> دووبارە هەوڵدان
        </button>
      </div>
    </div>
  );
}

function Row({
  icon,
  children,
}: {
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
        {icon}
      </span>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
