import { getBookingSettingsAdmin } from "./actions";
import { ScheduleForm } from "./ScheduleForm";
import { BookingsTabs } from "../BookingsTabs";
import { PageHeader } from "../../../_components/PageHeader";
import { Panel } from "../../../_components/Panel";

export default async function BookingSchedulePage({
  searchParams,
}: {
  searchParams: Promise<{ saved?: string }>;
}) {
  const { saved } = await searchParams;
  const settings = await getBookingSettingsAdmin();

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="سەردانەکان"
        description="ڕۆژ و کاتەکانی بەردەست لە فۆرمی سەردانی گشتیدا."
      />

      <BookingsTabs />

      {saved && (
        <p className="font-kurdish rounded-xl border border-pigment-teal/25 bg-pigment-teal/10 px-4 py-2.5 text-fluid-xs text-pigment-teal">
          گۆڕانکارییەکان پاشەکەوت کران.
        </p>
      )}

      <Panel title="ڕۆژ و کاتەکانی سەردان">
        <ScheduleForm settings={settings} />
      </Panel>
    </div>
  );
}
