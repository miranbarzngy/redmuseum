import { ScanFace } from "lucide-react";
import { SubmitButton } from "../../_components/SubmitButton";
import { getSystemSettings, updateFaceScanSetting } from "./actions";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-kurdish text-fluid-xl font-semibold text-ink">ڕێکخستنەکان</h1>
        <p className="mt-1 text-fluid-sm text-ink-soft">ڕێکخستنە گشتییەکانی ماڵپەڕ و فۆرمی سەردان.</p>
      </div>

      <form
        action={updateFaceScanSetting}
        className="flex max-w-2xl flex-col gap-4 rounded-2xl border border-ink/10 bg-white p-6 shadow-card sm:p-8"
      >
        <div className="flex items-start gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-pigment-terracotta/10 text-pigment-terracotta">
            <ScanFace size={18} />
          </span>
          <div className="flex-1">
            <label htmlFor="enable_face_scan" className="font-kurdish flex items-center gap-3 text-fluid-sm font-medium text-ink">
              <input
                id="enable_face_scan"
                name="enable_face_scan"
                type="checkbox"
                defaultChecked={settings.enable_face_scan}
                className="h-5 w-5 rounded border-ink/20 accent-pigment-terracotta"
              />
              پشتڕاستکردنەوەی ڕوخسار لە فۆرمی سەردان
            </label>
            <p className="font-kurdish mt-2 text-fluid-xs text-ink-faint">
              کاتێک چالاک بێت، میوانان لە کاتی داواکاری سەردان دەتوانن — بە دڵخوازی خۆیان — ڕوخساریان بۆ پشتڕاستکردنەوە
              تۆمار بکەن. کاتێک ناچالاک بێت، هیچ داتای ڕوخسارێک وەرناگیرێت یان هەڵناگیرێت، تەنانەت ئەگەر داواکارییەکە
              هەوڵی بدات.
            </p>
          </div>
        </div>

        <div className="border-t border-ink/10 pt-4">
          <SubmitButton>پاشەکەوتکردن</SubmitButton>
        </div>
      </form>
    </div>
  );
}
