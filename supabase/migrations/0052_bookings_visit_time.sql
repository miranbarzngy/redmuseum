-- Amna Suraka museum site — the booking wizard's time-slot step has always
-- picked a "HH:MM" slot (booking_settings.time_slots), but that value was
-- only ever baked as a formatted line into bookings.note (see the
-- "کاتژمێری سەردان: …" prefix in BookingClient.tsx) — never stored in its
-- own column, so the admin panel had no clean way to show it. This adds a
-- real column and stops the note-prefix workaround; existing rows are left
-- null since their time can't be reliably recovered from a localized,
-- free-text note.

alter table public.bookings
  add column if not exists visit_time text
    check (visit_time is null or visit_time ~ '^\d{2}:\d{2}$');
