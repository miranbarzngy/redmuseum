-- Amna Suraka museum site — the public booking form's info step now also
-- asks how many people are coming (guest_count) and what kind of visit it
-- is (visitor_type). Both are collected in
-- src/components/sections/BookingClient.tsx, validated again server-side in
-- src/app/api/booking/route.ts, and shown in the admin bookings list +
-- detail. Existing rows predate the fields, so they backfill to a party of
-- one / a personal visit.

alter table public.bookings
  add column if not exists guest_count int not null default 1
    check (guest_count >= 1 and guest_count <= 200),
  add column if not exists visitor_type text not null default 'personal'
    check (visitor_type in ('school', 'delegation', 'personal', 'press', 'other'));
