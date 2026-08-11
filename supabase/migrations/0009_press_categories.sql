-- Amna Suraka museum site — dynamic, admin-manageable press categories
-- Replaces the fixed `check (type in (...))` constraint on
-- public.press_media with a real table, so categories can be added,
-- renamed, reordered, or removed from the admin panel without a code
-- deploy — mirrors 0005_painting_categories.sql for the same reason.
-- Run after 0001_init.sql.

-- ============================================================================
-- press_categories
-- ============================================================================
create table if not exists public.press_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_ku text not null,
  label_en text not null,
  label_ar text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists press_categories_sort_idx on public.press_categories (sort_order, created_at);

create trigger press_categories_set_updated_at
  before update on public.press_categories
  for each row execute function public.set_updated_at();

alter table public.press_categories enable row level security;

create policy "Press categories are publicly readable"
  on public.press_categories for select
  using (true);

create policy "Admins can insert press categories"
  on public.press_categories for insert
  with check (public.is_admin());

create policy "Admins can update press categories"
  on public.press_categories for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete press categories"
  on public.press_categories for delete
  using (public.is_admin());

-- Seed the three categories that previously shipped as a hardcoded enum,
-- using the exact copy already shown on the public media filter tabs
-- (messages/*.json media.filters.*) so visible wording doesn't change.
insert into public.press_categories (slug, label_ku, label_en, label_ar, sort_order)
values
  ('interview', $t$چاوپێکەوتنەکان$t$, $t$Interviews$t$, $t$مقابلات$t$, 0),
  ('article', $t$بابەتەکان$t$, $t$Articles$t$, $t$مقالات$t$, 1),
  ('publication', $t$بڵاوکراوەکان$t$, $t$Publications$t$, $t$إصدارات$t$, 2)
on conflict (slug) do nothing;

-- ============================================================================
-- press_media.type (text, check-constrained) -> press_media.category_id (fk)
-- Add the new column, backfill it from the old text value via the slugs
-- above (the old "type" values already match these slugs exactly), enforce
-- not-null, then drop the old column and its check constraint entirely.
-- ON DELETE RESTRICT: a category with press items still assigned to it
-- can't be deleted out from under them — the admin has to reassign or
-- remove those items first.
-- ============================================================================
alter table public.press_media
  add column if not exists category_id uuid references public.press_categories (id) on delete restrict;

update public.press_media m
set category_id = c.id
from public.press_categories c
where m.type = c.slug
  and m.category_id is null;

alter table public.press_media alter column category_id set not null;
alter table public.press_media drop column if exists type;

create index if not exists press_media_category_id_idx on public.press_media (category_id);
