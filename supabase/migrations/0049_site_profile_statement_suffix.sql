-- Completes the admin-editable rotating hero statement (see
-- 0048_site_profile_statement_words.sql): the text that closes the sentence
-- after the rotating word (e.g. "ی کورد") was still hardcoded in
-- messages/ku.json. Kurdish only, same as the word list — the rotator only
-- ever runs for the ku locale.

alter table public.site_profile
  add column if not exists statement_suffix_ku text;

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- column may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
