-- Amna Suraka museum site — the public booking wizard's available days and
-- time slots used to be hardcoded constants in
-- src/components/sections/BookingClient.tsx. They now live in this
-- single-row settings table so the admin can edit them under
-- /admin/bookings/schedule.
--
-- open_weekdays: ISO-ish day numbers as JS Date.getDay() returns them —
--   0 = Sunday … 6 = Saturday. A day the museum is closed for visits is
--   simply left out.
-- time_slots: bookable start times as "HH:MM" (24h).
-- booking_window_days: how many days ahead the day picker shows.

create table if not exists public.booking_settings (
  id smallint primary key default 1,
  open_weekdays smallint[] not null default '{0,1,2,3,4,5,6}',
  time_slots text[] not null default '{09:00,10:00,11:00,13:00,14:00,15:00}',
  booking_window_days smallint not null default 21,
  updated_at timestamptz not null default now(),
  constraint booking_settings_single_row check (id = 1)
);

insert into public.booking_settings (id) values (1) on conflict (id) do nothing;

alter table public.booking_settings enable row level security;

-- Same rationale as system_settings (0022): the public booking page needs
-- to read this to build the day/time pickers, so it IS publicly readable.
-- Only the values matter, not confidentiality. Writes go exclusively
-- through the admin panel's service-role client.
create policy "Anyone can read booking settings"
  on public.booking_settings for select
  using (true);
