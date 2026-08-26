-- Amna Suraka museum site — admin-manageable gallery categories.
-- Replaces the fixed `check (category in (...))` constraint on
-- public.gallery with a real table, so categories can be added, renamed,
-- reordered, or removed from the admin panel without a code deploy —
-- mirrors the old press_categories approach (see 0009_press_categories.sql,
-- now dropped) for the same reason.

-- ============================================================================
-- gallery_categories
-- ============================================================================
create table if not exists public.gallery_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  label_ku text not null,
  label_en text not null,
  label_ar text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists gallery_categories_sort_idx on public.gallery_categories (sort_order, created_at);

create trigger gallery_categories_set_updated_at
  before update on public.gallery_categories
  for each row execute function public.set_updated_at();

alter table public.gallery_categories enable row level security;

create policy "Gallery categories are publicly readable"
  on public.gallery_categories for select
  using (true);

create policy "Admins can insert gallery categories"
  on public.gallery_categories for insert
  with check (public.is_admin());

create policy "Admins can update gallery categories"
  on public.gallery_categories for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete gallery categories"
  on public.gallery_categories for delete
  using (public.is_admin());

-- Seed the four categories that previously shipped as a hardcoded enum,
-- using the exact copy already shown on the public gallery section
-- (messages/*.json gallery.categories.*) so visible wording doesn't change.
insert into public.gallery_categories (slug, label_ku, label_en, label_ar, sort_order)
values
  ('activity', $t$چالاکییەکان$t$, $t$Activities$t$, $t$الأنشطة$t$, 0),
  ('donation', $t$بەخشینەکان$t$, $t$Donations$t$, $t$التبرعات$t$, 1),
  ('visitor', $t$سەردانی میوانان$t$, $t$Visitor Touring$t$, $t$جولات الزوار$t$, 2),
  ('delegation', $t$شاندە فەرمییەکان$t$, $t$Official Delegations$t$, $t$الوفود الرسمية$t$, 3)
on conflict (slug) do nothing;

-- ============================================================================
-- gallery.category (text, check-constrained) -> gallery.category_id (fk)
-- ON DELETE RESTRICT: a category with gallery images still assigned to it
-- can't be deleted out from under them — the admin has to reassign or
-- remove those images first.
-- ============================================================================
alter table public.gallery
  add column if not exists category_id uuid references public.gallery_categories (id) on delete restrict;

update public.gallery g
set category_id = c.id
from public.gallery_categories c
where g.category = c.slug
  and g.category_id is null;

alter table public.gallery alter column category_id set not null;
alter table public.gallery drop column if exists category;

create index if not exists gallery_category_id_idx on public.gallery (category_id, display_order);
