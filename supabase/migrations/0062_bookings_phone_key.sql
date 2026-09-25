-- Normalised phone for the public "check my booking" lookup
-- (/api/booking/lookup). The route used to pull the newest 2000 bookings
-- and compare phones in JS, which silently missed every older booking once
-- the table grew past that. This stores the same key the route computes —
-- digits only, then the last 9 (drops +964 / 00964 / a leading 0) — so the
-- match happens in an indexed query instead.
--
-- Must stay in sync with phoneKey() in src/app/api/booking/lookup/route.ts.
-- Run BEFORE deploying the matching app code.

alter table public.bookings
  add column if not exists phone_key text
  generated always as (right(regexp_replace(phone, '[^0-9]', '', 'g'), 9)) stored;

create index if not exists bookings_phone_key_idx on public.bookings (phone_key, created_at desc);

notify pgrst, 'reload schema';
