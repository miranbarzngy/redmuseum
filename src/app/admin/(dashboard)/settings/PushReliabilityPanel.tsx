"use client";

import { useCallback, useEffect, useState } from "react";
import { BatteryCharging, Bell, CheckCircle2, AlertTriangle, Rocket, Smartphone } from "lucide-react";
import { Panel } from "../../_components/Panel";
import { btnSecondary } from "../../_components/Button";
import { useIsNativeApp } from "@/lib/useIsNativeApp";
import { BackgroundDelivery, type BackgroundDeliveryPlugin } from "@/lib/nativeBackgroundDelivery";

type Status = Awaited<ReturnType<BackgroundDeliveryPlugin["getStatus"]>>;

export function PushReliabilityPanel() {
  const isNative = useIsNativeApp();

  return (
    <Panel
      title="گەیشتنی ئاگادارکردنەوەکان"
      description="بۆ ئەوەی ئاگادارکردنەوەکان یەکسەر بگەن، تەنانەت کاتێک ئەپ داخراوە."
    >
      {isNative ? (
        <NativeChecks />
      ) : (
        <p className="font-kurdish flex items-center gap-2 text-fluid-xs text-ink-faint">
          <Smartphone size={15} className="shrink-0" />
          ئەم تایبەتمەندییە تەنها لەناو ئەپی ئەندرۆیددا کاردەکات.
        </p>
      )}
    </Panel>
  );
}

function NativeChecks() {
  // undefined = loading, null = this APK predates the native plugin.
  const [status, setStatus] = useState<Status | null | undefined>(undefined);

  const refresh = useCallback(() => {
    BackgroundDelivery.getStatus().then(setStatus, () => setStatus(null));
  }, []);

  useEffect(() => {
    refresh();
    // Re-check when the user comes back from a system settings screen.
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);

  if (status === undefined) return null;
  if (status === null) {
    return (
      <p className="font-kurdish flex items-center gap-2 text-fluid-xs text-ink-faint">
        <AlertTriangle size={15} className="shrink-0" />
        ئەپەکە نوێ بکەرەوە بۆ بەکارهێنانی ئەم ڕێکخستنانە.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      <CheckRow
        ok={status.notificationsEnabled}
        icon={<Bell size={15} />}
        label="ئاگادارکردنەوەکان چالاکن"
        action="چالاککردن"
        onFix={() => BackgroundDelivery.openNotificationSettings()}
      />
      <CheckRow
        ok={status.ignoringBatteryOptimizations}
        icon={<BatteryCharging size={15} />}
        label="ڕێگەدان بە کارکردن لە پاشبنەما (بێ سنووری پاتری)"
        action="ڕێگەدان"
        onFix={() => BackgroundDelivery.requestIgnoreBatteryOptimizations()}
      />
      {status.hasAutostartScreen && (
        // Vendor screens can't be queried, so this one never shows as done.
        <CheckRow
          ok={null}
          icon={<Rocket size={15} />}
          label={`دەستپێکردنی خۆکار (${status.manufacturer})`}
          action="کردنەوە"
          onFix={() => BackgroundDelivery.openAutostartSettings()}
        />
      )}
    </ul>
  );
}

function CheckRow({
  ok,
  icon,
  label,
  action,
  onFix,
}: {
  ok: boolean | null;
  icon: React.ReactNode;
  label: string;
  action: string;
  onFix: () => void;
}) {
  return (
    <li className="flex items-center justify-between gap-3">
      <span className="font-kurdish flex items-center gap-2 text-fluid-xs">
        {icon}
        {label}
      </span>
      {ok ? (
        <CheckCircle2 size={18} className="shrink-0 text-green-600" />
      ) : (
        <button type="button" onClick={onFix} className={`${btnSecondary} shrink-0`}>
          {action}
        </button>
      )}
    </li>
  );
}
