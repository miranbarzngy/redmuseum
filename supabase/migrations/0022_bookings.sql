-- Amna Suraka museum site — visit booking form
-- Adds a dedicated public booking flow (separate from the general Contact
-- form's "Visit / Group booking" option) plus an admin-controlled toggle
-- for the optional face-scan check-in feature.

create table if not exists public.system_settings (
  id smallint primary key default 1,
  enable_face_scan boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint system_settings_single_row check (id = 1)
);

insert into public.system_settings (id, enable_face_scan)
values (1, false)
on conflict (id) do nothing;

alter table public.system_settings enable row level security;

-- The public booking page needs to read this flag client-side (to decide
-- whether to mount the camera component at all) before a session exists,
-- so unlike contact_messages/admin_push_tokens this table IS publicly
-- readable. Only the value matters, not confidentiality.
create policy "Anyone can read system settings"
  on public.system_settings for select
  using (true);

-- Writes happen exclusively through the admin panel's service-role client,
-- gated by requireAdminSession() — same shape as every other admin-editable
-- table in this project. No update/insert/delete policy is granted to the
-- anon key.

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  visit_date date not null,
  note text,
  -- Populated only when system_settings.enable_face_scan was true at
  -- submission time — enforced server-side in src/app/api/booking/route.ts,
  -- never trusted from the client payload. A face descriptor array from
  -- face-api.js, not a raw image.
  face_vector_data jsonb,
  face_scan_consent boolean not null default false,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'checked_in', 'cancelled', 'no_show')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_visit_date_idx on public.bookings (visit_date);
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);

create or replace function public.set_bookings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_bookings_updated_at
before update on public.bookings
for each row execute function public.set_bookings_updated_at();

alter table public.bookings enable row level security;

-- Same shape as contact_messages: holds visitor PII (and, when face scan is
-- on, biometric data), so it is NOT publicly readable. The only permissive
-- policy is insert, and even that is only reachable through
-- src/app/api/booking/route.ts (which validates input and re-checks
-- enable_face_scan server-side) rather than a raw client-side insert call.
-- Reading, updating, and deleting all require the service-role client,
-- confined to src/app/admin/**/actions.ts and gated by requireAdminSession().
create policy "Anyone can submit a booking"
  on public.bookings for insert
  with check (true);
