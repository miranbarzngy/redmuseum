-- Amna Suraka museum site — manual drag-and-drop ordering for paintings
-- Previously both the admin list and the public gallery ordered paintings
-- by year (descending), which the admin has no control over otherwise.
-- Adds an explicit sort_order the admin panel can reorder via
-- drag-and-drop, matching the same pattern just added for exhibitions.

alter table public.paintings
  add column if not exists sort_order integer not null default 0;

-- Backfill: preserve the current display order (year desc, same as the
-- existing query) as the initial drag-and-drop order.
with ordered as (
  select id, row_number() over (order by year desc, created_at asc) - 1 as rn
  from public.paintings
)
update public.paintings p
set sort_order = ordered.rn
from ordered
where ordered.id = p.id;
