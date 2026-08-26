-- Amna Suraka museum site — replace the press/media feature with a
-- category-grouped image gallery. Drops the now-unused press tables and
-- adds `gallery`.

drop table if exists public.press_media;
drop table if exists public.press_categories;

-- ============================================================================
-- gallery
-- ============================================================================
create table if not exists public.gallery (
  id uuid primary key default gen_random_uuid(),
  image_url text not null,
  title text,
  category text not null check (category in ('activity', 'donation', 'visitor', 'delegation')),
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists gallery_category_idx on public.gallery (category, display_order);

alter table public.gallery enable row level security;

create policy "Active gallery images are publicly readable"
  on public.gallery for select
  using (is_active = true);

create policy "Admins can insert gallery images"
  on public.gallery for insert
  with check (public.is_admin());

create policy "Admins can update gallery images"
  on public.gallery for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete gallery images"
  on public.gallery for delete
  using (public.is_admin());
