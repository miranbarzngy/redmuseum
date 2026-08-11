-- Amna Suraka museum site — Biography section content
-- Run after 0001_init.sql and 0002_site_profile.sql.

-- ============================================================================
-- biography_intro — singleton: the eyebrow/heading/intro above the
-- paragraph blocks. Any field left blank falls back to the shipped
-- translation strings (see src/lib/data/biography.ts), same as site_profile.
-- ============================================================================
create table if not exists public.biography_intro (
  id smallint primary key default 1,
  eyebrow_ku text,
  eyebrow_en text,
  eyebrow_ar text,
  heading_ku text,
  heading_en text,
  heading_ar text,
  intro_ku text,
  intro_en text,
  intro_ar text,
  updated_at timestamptz not null default now(),
  constraint biography_intro_singleton check (id = 1)
);

create trigger biography_intro_set_updated_at
  before update on public.biography_intro
  for each row execute function public.set_updated_at();

alter table public.biography_intro enable row level security;

create policy "Biography intro is publicly readable"
  on public.biography_intro for select
  using (true);

create policy "Admins can insert biography intro"
  on public.biography_intro for insert
  with check (public.is_admin());

create policy "Admins can update biography intro"
  on public.biography_intro for update
  using (public.is_admin())
  with check (public.is_admin());

-- ============================================================================
-- biography_blocks — the alternating paragraph+portrait vignettes. A list,
-- not a singleton, so the admin can add/remove/reorder them. Empty table
-- falls back to the shipped paragraphs + seeded placeholder art, same
-- fallback pattern as everywhere else.
-- ============================================================================
create table if not exists public.biography_blocks (
  id uuid primary key default gen_random_uuid(),
  body_ku text not null default '',
  body_en text not null default '',
  body_ar text not null default '',
  image_url text,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists biography_blocks_sort_idx on public.biography_blocks (sort_order, created_at);

create trigger biography_blocks_set_updated_at
  before update on public.biography_blocks
  for each row execute function public.set_updated_at();

alter table public.biography_blocks enable row level security;

create policy "Biography blocks are publicly readable"
  on public.biography_blocks for select
  using (true);

create policy "Admins can insert biography blocks"
  on public.biography_blocks for insert
  with check (public.is_admin());

create policy "Admins can update biography blocks"
  on public.biography_blocks for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete biography blocks"
  on public.biography_blocks for delete
  using (public.is_admin());
