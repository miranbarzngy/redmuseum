"use client";

import { useState } from "react";
import clsx from "clsx";
import { updateBookingSettings } from "./actions";
import { Field } from "../../../_components/Field";
import { SubmitButton } from "../../../_components/SubmitButton";
import type { BookingSettingsRow } from "@/lib/supabase/database.types";

// JS Date.getDay() order: 0 = Sunday … 6 = Saturday.
const WEEKDAYS = ["یەک‌شەممە", "دووشەممە", "سێ‌شەممە", "چوارشەممە", "پێنج‌شەممە", "هەینی", "شەممە"];

// Hourly candidates the museum could open a slot on.
const SLOT_CHOICES = Array.from({ length: 11 }, (_, i) => `${String(8 + i).padStart(2, "0")}:00`);

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={clsx(
        "font-kurdish rounded-full px-3.5 py-2 text-fluid-xs font-medium transition-colors",
        active
          ? "bg-ink text-canvas"
          : "border border-ink/15 text-ink-soft hover:border-pigment-terracotta hover:text-pigment-terracotta"
      )}
    >
      {children}
    </button>
  );
}

export function ScheduleForm({ settings }: { settings: BookingSettingsRow }) {
  const [weekdays, setWeekdays] = useState<Set<number>>(new Set(settings.open_weekdays));
  const [slots, setSlots] = useState<Set<string>>(new Set(settings.time_slots));

  function toggle<T>(set: Set<T>, value: T): Set<T> {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    return next;
  }

  return (
    <form action={updateBookingSettings} className="flex flex-col gap-7">
      <div className="flex flex-col gap-2.5">
        <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">ڕۆژانی کراوە بۆ سەردان</span>
        <div className="flex flex-wrap gap-2">
          {WEEKDAYS.map((label, i) => (
            <Chip key={i} active={weekdays.has(i)} onClick={() => setWeekdays((s) => toggle(s, i))}>
              {label}
            </Chip>
          ))}
        </div>
        {[...weekdays].sort((a, b) => a - b).map((d) => (
          <input key={d} type="hidden" name="weekday" value={d} />
        ))}
        <span className="font-kurdish text-fluid-xs text-ink-faint">
          ئەو ڕۆژانەی مۆزەخانە داواکاری سەردانیان بۆ وەردەگرێت.
        </span>
      </div>

      <div className="flex flex-col gap-2.5">
        <span className="font-kurdish text-fluid-xs font-medium text-ink-soft">کاتەکانی سەردان</span>
        <div className="flex flex-wrap gap-2" dir="ltr">
          {SLOT_CHOICES.map((slot) => (
            <Chip key={slot} active={slots.has(slot)} onClick={() => setSlots((s) => toggle(s, slot))}>
              {slot}
            </Chip>
          ))}
        </div>
        {[...slots].sort().map((s) => (
          <input key={s} type="hidden" name="slot" value={s} />
        ))}
        <span className="font-kurdish text-fluid-xs text-ink-faint">
          ئەو کاتژمێرانەی لە فۆرمی سەردان بۆ میوان دەردەکەون.
        </span>
      </div>

      <Field
        label="ماوەی پێشتر تۆمارکردن (ڕۆژ)"
        name="booking_window_days"
        type="number"
        dir="ltr"
        defaultValue={settings.booking_window_days}
        hint="میوان دەتوانێت هەتا چەند ڕۆژ لە پێشدا سەردان تۆمار بکات."
        className="max-w-[16rem]"
      />

      <div className="flex justify-end border-t border-ink/10 pt-4">
        <SubmitButton>پاشەکەوتکردن</SubmitButton>
      </div>
    </form>
  );
}
