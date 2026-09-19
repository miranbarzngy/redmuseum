-- The hero subtitle's rotating historical term (Anfal / genocide / victims /
-- struggle / sovereignty) was shipped as a hardcoded list in messages/ku.json.
-- Making it admin-editable needs a place to persist the word list per site,
-- so it's a text[] column on site_profile alongside the other hero fields.
-- Kurdish only — the rotator only ever runs for the ku locale.

alter table public.site_profile
  add column if not exists statement_words_ku text[];

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- column may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
