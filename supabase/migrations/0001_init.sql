-- Amna Suraka museum site — initial schema
-- Run via `supabase db push`, the SQL editor in the Supabase dashboard, or
-- the CLI migration workflow (`supabase migration up`).

-- ============================================================================
-- Extensions
-- ============================================================================
create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ============================================================================
-- admins — allowlist of auth.users permitted to write content via the anon/
-- publishable key under RLS. NOTE: the admin panel itself does NOT use
-- Supabase Auth — it gates access with a single shared password and writes
-- through the service-role key (which bypasses RLS entirely), so nothing
-- here is required for the admin panel to work. This table only matters if
-- you also want real per-user Supabase Auth sessions to be able to write
-- under RLS (e.g. a future non-service-role client). Membership is managed
-- by hand (Supabase dashboard / service role), never through the public
-- API — there is deliberately no INSERT/UPDATE/DELETE policy below, so an
-- authenticated user can never grant themselves access.
-- ============================================================================
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

create policy "Admins can see their own membership row"
  on public.admins for select
  using (user_id = auth.uid());

-- security definer so the check works even though callers have no broader
-- read access to public.admins; search_path is pinned to prevent hijacking.
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from public.admins where user_id = auth.uid()
  );
$$;

-- ============================================================================
-- updated_at helper trigger
-- ============================================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
-- paintings
-- Note: the requested column list (id, title_*, description_*, image_url,
-- category, year, created_at) is extended with medium_* and updated_at —
-- the storefront's Lightbox already displays a "medium" line (e.g. "Oil on
-- canvas") per painting, so it needs somewhere to live; updated_at is
-- standard bookkeeping for anything editable from the admin panel.
-- ============================================================================
create table if not exists public.paintings (
  id uuid primary key default gen_random_uuid(),
  title_ku text not null,
  title_en text not null,
  title_ar text not null,
  description_ku text not null default '',
  description_en text not null default '',
  description_ar text not null default '',
  medium_ku text not null default '',
  medium_en text not null default '',
  medium_ar text not null default '',
  image_url text,
  category text not null check (category in ('historical', 'political', 'portraits')),
  year integer not null check (year between 1000 and 3000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists paintings_category_idx on public.paintings (category);
create index if not exists paintings_year_idx on public.paintings (year desc);

create trigger paintings_set_updated_at
  before update on public.paintings
  for each row execute function public.set_updated_at();

alter table public.paintings enable row level security;

create policy "Paintings are publicly readable"
  on public.paintings for select
  using (true);

create policy "Admins can insert paintings"
  on public.paintings for insert
  with check (public.is_admin());

create policy "Admins can update paintings"
  on public.paintings for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete paintings"
  on public.paintings for delete
  using (public.is_admin());

-- ============================================================================
-- press_media
-- Note: extended with excerpt_* — the press cards on the site show a short
-- summary beneath the headline, which the requested column list didn't
-- include a home for.
-- ============================================================================
create table if not exists public.press_media (
  id uuid primary key default gen_random_uuid(),
  title_ku text not null,
  title_en text not null,
  title_ar text not null,
  excerpt_ku text not null default '',
  excerpt_en text not null default '',
  excerpt_ar text not null default '',
  source text not null,
  url text not null,
  date date not null,
  type text not null check (type in ('interview', 'article', 'publication')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists press_media_type_idx on public.press_media (type);
create index if not exists press_media_date_idx on public.press_media (date desc);

create trigger press_media_set_updated_at
  before update on public.press_media
  for each row execute function public.set_updated_at();

alter table public.press_media enable row level security;

create policy "Press media is publicly readable"
  on public.press_media for select
  using (true);

create policy "Admins can insert press media"
  on public.press_media for insert
  with check (public.is_admin());

create policy "Admins can update press media"
  on public.press_media for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete press media"
  on public.press_media for delete
  using (public.is_admin());

-- ============================================================================
-- exhibitions
-- ============================================================================
create table if not exists public.exhibitions (
  id uuid primary key default gen_random_uuid(),
  title_ku text not null,
  title_en text not null,
  title_ar text not null,
  details_ku text not null default '',
  details_en text not null default '',
  details_ar text not null default '',
  year text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists exhibitions_year_idx on public.exhibitions (year);

create trigger exhibitions_set_updated_at
  before update on public.exhibitions
  for each row execute function public.set_updated_at();

alter table public.exhibitions enable row level security;

create policy "Exhibitions are publicly readable"
  on public.exhibitions for select
  using (true);

create policy "Admins can insert exhibitions"
  on public.exhibitions for insert
  with check (public.is_admin());

create policy "Admins can update exhibitions"
  on public.exhibitions for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete exhibitions"
  on public.exhibitions for delete
  using (public.is_admin());

-- ============================================================================
-- Storage — "artwork" bucket for painting images uploaded from the admin
-- panel. Public read (so <Image> can load it on the storefront), admin-only
-- write.
-- ============================================================================
insert into storage.buckets (id, name, public)
values ('artwork', 'artwork', true)
on conflict (id) do nothing;

create policy "Artwork images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'artwork');

create policy "Admins can upload artwork images"
  on storage.objects for insert
  with check (bucket_id = 'artwork' and public.is_admin());

create policy "Admins can update artwork images"
  on storage.objects for update
  using (bucket_id = 'artwork' and public.is_admin())
  with check (bucket_id = 'artwork' and public.is_admin());

create policy "Admins can delete artwork images"
  on storage.objects for delete
  using (bucket_id = 'artwork' and public.is_admin());

-- ============================================================================
-- Post-deploy
-- ============================================================================
-- The admin panel (/admin) is gated by ADMIN_PASSWORD in .env.local, not by
-- a Supabase Auth user — there's nothing to create here for it to work.
--
-- The `admins` table above is only relevant if you separately want a real
-- Supabase Auth user to be able to write under RLS (e.g. via the anon key,
-- outside the admin panel). If so:
--   1. Create that user in Authentication > Users.
--   2. insert into public.admins (user_id) values ('<their auth.users.id>');
