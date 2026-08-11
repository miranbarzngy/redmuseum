-- Amna Suraka museum site — homepage profile content
-- Singleton row backing the Hero section (eyebrow, name, statement, portrait
-- image) so it's editable from /admin instead of being hardcoded in the
-- translation files. Run after 0001_init.sql.

create table if not exists public.site_profile (
  id smallint primary key default 1,
  eyebrow_ku text,
  eyebrow_en text,
  eyebrow_ar text,
  name_ku text,
  name_en text,
  name_ar text,
  statement_ku text,
  statement_en text,
  statement_ar text,
  hero_image_url text,
  updated_at timestamptz not null default now(),
  constraint site_profile_singleton check (id = 1)
);

create trigger site_profile_set_updated_at
  before update on public.site_profile
  for each row execute function public.set_updated_at();

alter table public.site_profile enable row level security;

create policy "Site profile is publicly readable"
  on public.site_profile for select
  using (true);

-- Admin panel writes through the service-role key (see src/lib/supabase/admin.ts),
-- which bypasses RLS entirely — these mirror the other tables' policies purely
-- as defense in depth against the anon/publishable key.
create policy "Admins can insert site profile"
  on public.site_profile for insert
  with check (public.is_admin());

create policy "Admins can update site profile"
  on public.site_profile for update
  using (public.is_admin())
  with check (public.is_admin());

-- Any field left blank falls back to the shipped translation strings (see
-- src/lib/data/profile.ts), so leaving this table empty is safe — nothing
-- needs seeding for the homepage to render correctly on first deploy.
