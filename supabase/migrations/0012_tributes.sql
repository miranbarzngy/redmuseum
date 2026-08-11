-- Amna Suraka museum site — tributes, fan mentions, prizes & recognitions
-- A lightweight content type distinct from press_media: short attributed
-- quotes/dedications/awards rather than full articles with a source link.
-- Follows the same shape convention as press_media — person_name stays a
-- single column (a proper noun/attribution, like press_media.source),
-- while title/details are trilingual since they're real page copy.

create table if not exists public.tributes (
  id uuid primary key default gen_random_uuid(),
  title_ku text not null,
  title_en text not null,
  title_ar text not null,
  person_name text not null,
  details_ku text not null,
  details_en text not null,
  details_ar text not null,
  image_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists tributes_created_at_idx on public.tributes (created_at desc);

create trigger tributes_set_updated_at
  before update on public.tributes
  for each row execute function public.set_updated_at();

alter table public.tributes enable row level security;

create policy "Tributes are publicly readable"
  on public.tributes for select
  using (true);

create policy "Admins can insert tributes"
  on public.tributes for insert
  with check (public.is_admin());

create policy "Admins can update tributes"
  on public.tributes for update
  using (public.is_admin())
  with check (public.is_admin());

create policy "Admins can delete tributes"
  on public.tributes for delete
  using (public.is_admin());
