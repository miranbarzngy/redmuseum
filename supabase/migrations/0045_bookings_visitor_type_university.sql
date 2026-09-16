-- The "school / university" visitor type (0033) is being split into two
-- distinct options in the public booking form and the admin bookings list —
-- خوێندنگە (school) and زانکۆ (university) — instead of one combined
-- choice. Existing 'school' rows keep meaning "school"; this just widens
-- the allowed set to also accept 'university'.

alter table public.bookings
  drop constraint if exists bookings_visitor_type_check,
  add constraint bookings_visitor_type_check
    check (visitor_type in ('school', 'university', 'delegation', 'personal', 'press', 'other'));
