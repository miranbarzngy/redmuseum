-- Per-language year on history events (e.g. "١٩٧٩" / "1979" / "١٩٧٩"),
-- matching the title_/details_ *_ku/_en/_ar columns. Existing rows copy
-- their single year into all three languages before the old column goes.

alter table public.exhibitions
  add column if not exists year_ku text not null default '',
  add column if not exists year_en text not null default '',
  add column if not exists year_ar text not null default '';

update public.exhibitions
set year_ku = year, year_en = year, year_ar = year
where year_ku = '' and year_en = '' and year_ar = '';

drop index if exists public.exhibitions_year_idx;
alter table public.exhibitions drop column if exists year;

notify pgrst, 'reload schema';
