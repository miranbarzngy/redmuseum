-- Amna Suraka museum site — admin-manageable booking visit-type categories.
-- Replaces the fixed `check (visitor_type in (...))` constraint on
-- public.bookings (0033, 0045) with a real table, so visit-type categories
-- can be added, renamed, reordered, or removed from the admin panel without
-- a code deploy — mirrors gallery_categories (0027_gallery_categories.sql).

-- ============================================================================
-- booking_visitor_types
-- ============================================================================
create table if not exists public.booking_visitor_types (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_ku text not null,
  label_en text not null,
  label_ar text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists booking_visitor_types_sort_idx on public.booking_visitor_types (sort_order, created_at);

create trigger booking_visitor_types_set_updated_at
  before update on public.booking_visitor_types
  for each row execute function public.set_updated_at();

alter table public.booking_visitor_types enable row level security;

create policy "Booking visitor types are publicly readable"
  on public.booking_visitor_types for select
  using (true);

create policy "Admins can insert booking visitor types"
  on public.booking_visitor_types for insert
  with check (public.is_admin());

create policy "Admins can update booking visitor types"
  on public.booking_visitor_types for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete booking visitor types"
  on public.booking_visitor_types for delete
  using (public.is_admin());

-- Seed the six visit types that previously shipped as a hardcoded
-- check-constrained enum (0033, 0045), using the exact copy already shown
-- on the public booking form (messages/*.json booking.form.visitorTypes) so
-- visible wording doesn't change.
insert into public.booking_visitor_types (slug, label_ku, label_en, label_ar, sort_order)
values
  ('school', $t$سەردانی خوێندنگە$t$, $t$School$t$, $t$مدرسة$t$, 0),
  ('university', $t$سەردانی زانکۆ$t$, $t$University$t$, $t$جامعة$t$, 1),
  ('delegation', $t$سەردانی وەفدی فەرمی$t$, $t$Official delegation$t$, $t$وفد رسمي$t$, 2),
  ('personal', $t$سەردانی کەسی$t$, $t$Personal$t$, $t$شخصية$t$, 3),
  ('press', $t$ڕۆژنامەوانی$t$, $t$Press$t$, $t$صحافة$t$, 4),
  ('other', $t$هیتر$t$, $t$Other$t$, $t$أخرى$t$, 5)
on conflict (slug) do nothing;

-- ============================================================================
-- bookings.visitor_type (text, check-constrained) -> bookings.visitor_type_id (fk)
-- ON DELETE RESTRICT: a visit-type category still referenced by bookings
-- can't be deleted out from under them — the admin has to reassign or
-- remove those bookings first.
-- ============================================================================
alter table public.bookings
  add column if not exists visitor_type_id uuid references public.booking_visitor_types (id) on delete restrict;

update public.bookings b
set visitor_type_id = c.id
from public.booking_visitor_types c
where b.visitor_type = c.slug
  and b.visitor_type_id is null;

alter table public.bookings alter column visitor_type_id set not null;
alter table public.bookings drop constraint if exists bookings_visitor_type_check;
alter table public.bookings drop column if exists visitor_type;

create index if not exists bookings_visitor_type_id_idx on public.bookings (visitor_type_id);

-- ============================================================================
-- notify_new_booking(): the push-notification trigger (0023, repointed by
-- 0039) forwarded `visitor_type` as a human-readable slug straight from
-- row_to_json(new). Now that it's a uuid FK, resolve the Kurdish label at
-- insert time so notify-admin/route.ts (which has no DB access of its own)
-- can keep building the push body without needing a lookup table.
--
-- Before running this in the Supabase SQL editor, replace
-- <YOUR_WEBHOOK_SECRET> below with the SAME value already set as
-- WEBHOOK_SECRET on the deployed Next.js app (redmuseum.vercel.app project,
-- not NEXT_PUBLIC_) — see 0039 for the same note. Never commit the real
-- value here — this file is version-controlled in a public repo.
-- ============================================================================
create or replace function public.notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  visitor_type_label text;
begin
  select label_ku into visitor_type_label
  from public.booking_visitor_types
  where id = new.visitor_type_id;

  perform net.http_post(
    url := 'https://redmuseum.vercel.app/api/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object(
      'table', 'bookings',
      'record', row_to_json(new)::jsonb || jsonb_build_object('visitor_type_label', visitor_type_label)
    )
  );
  return new;
end;
$$;
