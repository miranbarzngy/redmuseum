import { ScanFace } from "lucide-react";
import { getSystemSettings, updateFaceScanSetting } from "./actions";
import { PageHeader } from "../../_components/PageHeader";
import { Panel } from "../../_components/Panel";
import { Toggle } from "../../_components/Toggle";
import { SubmitButton } from "../../_components/SubmitButton";

export default async function AdminSettingsPage() {
  const settings = await getSystemSettings();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-8">
      <PageHeader
        title="ڕێکخستنەکان"
        description="ڕێکخستنە گشتییەکانی ماڵپەڕ و فۆرمی سەردان."
      />

      <Panel title="فۆرمی سەردان">
        <form action={updateFaceScanSetting} className="flex flex-col gap-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-pigment-terracotta/10 text-pigment-terracotta">
                <ScanFace size={18} />
              </span>
              <div>
                <label
                  htmlFor="enable_face_scan"
                  className="font-kurdish text-fluid-sm font-medium text-ink"
                >
                  پشتڕاستکردنەوەی ڕوخسار لە فۆرمی سەردان
                </label>
                <p className="font-kurdish mt-1 text-fluid-xs text-ink-faint">
                  کاتێک چالاک بێت، میوانان ناتوانن داواکاری سەردان بنێرن هەتا وێنەی ڕوخساریان تۆمار
                  نەکەن. کاتێک ناچالاک بێت، هیچ وێنەیەکی ڕوخسار وەرناگیرێت یان هەڵناگیرێت، و فۆرمەکە
                  بەبێ پشتڕاستکردنەوە دەنێردرێت.
                </p>
              </div>
            </div>
            <div className="shrink-0 pt-1">
              <Toggle
                id="enable_face_scan"
                name="enable_face_scan"
                defaultChecked={settings.enable_face_scan}
              />
            </div>
          </div>

          <div className="flex justify-end border-t border-ink/10 pt-4">
            <SubmitButton>پاشەکەوتکردن</SubmitButton>
          </div>
        </form>
      </Panel>

      <Panel title="زیاتر">
        <p className="font-kurdish text-fluid-xs text-ink-faint">
          ڕێکخستنی زیاتر بەم زووانە لێرە زیاد دەکرێن.
        </p>
      </Panel>
    </div>
  );
}
