-- Amna Suraka museum site — manual drag-and-drop ordering for exhibitions
-- Previously the admin list was ordered by the free-text "year" column,
-- which sorts inconsistently (it's not a real date/number, and can hold
-- ranges like "2019-2020"). Adds an explicit sort_order the admin panel can
-- reorder via drag-and-drop, matching the pattern already used for
-- biography_blocks and painting_categories.

alter table public.exhibitions
  add column if not exists sort_order integer not null default 0;

-- Backfill: preserve current relative order (oldest created_at first) as
-- the initial drag-and-drop order, rather than leaving everything at 0.
with ordered as (
  select id, row_number() over (order by created_at asc) - 1 as rn
  from public.exhibitions
)
update public.exhibitions e
set sort_order = ordered.rn
from ordered
where ordered.id = e.id;
