-- Amna Suraka museum site — dynamic, admin-manageable painting categories
-- Replaces the fixed `check (category in (...))` constraint on
-- public.paintings with a real table, so categories can be added, renamed,
-- reordered, or removed from the admin panel without a code deploy.
-- Run after 0001_init.sql.

-- ============================================================================
-- painting_categories
-- ============================================================================
create table if not exists public.painting_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_ku text not null,
  label_en text not null,
  label_ar text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists painting_categories_sort_idx on public.painting_categories (sort_order, created_at);

create trigger painting_categories_set_updated_at
  before update on public.painting_categories
  for each row execute function public.set_updated_at();

alter table public.painting_categories enable row level security;

create policy "Painting categories are publicly readable"
  on public.painting_categories for select
  using (true);

create policy "Admins can insert painting categories"
  on public.painting_categories for insert
  with check (public.is_admin());

create policy "Admins can update painting categories"
  on public.painting_categories for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete painting categories"
  on public.painting_categories for delete
  using (public.is_admin());

-- Seed the three categories that previously shipped as a hardcoded enum,
-- using the exact copy already shown on the public gallery's filter tabs
-- (messages/*.json gallery.filters.*) so visible wording doesn't change.
insert into public.painting_categories (slug, label_ku, label_en, label_ar, sort_order)
values
  ('historical', $t$تابلۆ مێژوویی و نیشتمانییەکان$t$, $t$Historical & National$t$, $t$لوحات تاريخية ووطنية$t$, 0),
  ('political', $t$کاریکاتێر و ڕەخنەی سیاسی$t$, $t$Political Caricature$t$, $t$كاريكاتير ونقد سياسي$t$, 1),
  ('portraits', $t$پۆرترێتەکان$t$, $t$Portraits$t$, $t$بورتريهات$t$, 2)
on conflict (slug) do nothing;

-- ============================================================================
-- paintings.category (text, check-constrained) -> paintings.category_id (fk)
-- Add the new column, backfill it from the old text value via the slugs
-- above, enforce not-null, then drop the old column and its check
-- constraint entirely. ON DELETE RESTRICT: a category with paintings still
-- assigned to it can't be deleted out from under them — the admin has to
-- reassign or remove those paintings first, which is a clearer failure mode
-- than silently orphaning or cascading deletes across paintings.
-- ============================================================================
alter table public.paintings
  add column if not exists category_id uuid references public.painting_categories (id) on delete restrict;

update public.paintings p
set category_id = c.id
from public.painting_categories c
where p.category = c.slug
  and p.category_id is null;

alter table public.paintings alter column category_id set not null;
alter table public.paintings drop column if exists category;

create index if not exists paintings_category_id_idx on public.paintings (category_id);
