import { Download, Smartphone, Monitor } from "lucide-react";
import { Panel } from "../../_components/Panel";
import { btnPrimary } from "../../_components/Button";
import { getAppVersionManifest } from "@/lib/appVersionManifest";

/**
 * Direct download links for the admin shell installers — separate from
 * AppUpdatePanel, which only handles checking/installing updates from
 * *inside* the already-installed Android app. This panel is what an admin
 * opening /admin/settings in an ordinary browser (on their phone or their
 * Windows PC) uses to get the app in the first place.
 */
export function AppDownloadsPanel() {
  const manifest = getAppVersionManifest();

  return (
    <Panel
      title="داگرتنی ئەپەکان"
      description="وەشانی ئەپی بەڕێوەبردن بۆ ئەندرۆید و وینڈۆز دابگرە."
    >
      <div className="flex flex-col gap-3">
        <DownloadRow
          icon={<Smartphone size={16} className="text-pigment-terracotta" />}
          label="ئەندرۆید (APK)"
          version={manifest.versionName}
          url={manifest.apkUrl}
        />
        <DownloadRow
          icon={<Monitor size={16} className="text-pigment-terracotta" />}
          label="وینڈۆز (EXE)"
          version={manifest.exeVersionName}
          url={manifest.exeUrl}
        />
      </div>
    </Panel>
  );
}

function DownloadRow({
  icon,
  label,
  version,
  url,
}: {
  icon: React.ReactNode;
  label: string;
  version: string | null;
  url: string | null;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-ink/10 px-4 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pigment-terracotta/10">
          {icon}
        </span>
        <div className="min-w-0">
          <p className="font-kurdish text-fluid-sm font-medium text-ink">{label}</p>
          {version && (
            <p className="font-kurdish text-fluid-xs text-ink-faint">وەشان {version}</p>
          )}
        </div>
      </div>
      {url ? (
        <a href={url} download className={btnPrimary}>
          <Download size={15} />
          داگرتن
        </a>
      ) : (
        <span className="font-kurdish shrink-0 text-fluid-xs text-ink-faint">
          هێشتا بەردەست نییە
        </span>
      )}
    </div>
  );
}
