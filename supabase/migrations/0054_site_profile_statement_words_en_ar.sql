-- Extends the admin-editable rotating hero statement (see
-- 0048_site_profile_statement_words.sql and
-- 0049_site_profile_statement_suffix.sql) from Kurdish-only to all three
-- site locales, so the admin can opt English and Arabic into the same
-- optional word-list + suffix pattern.

alter table public.site_profile
  add column if not exists statement_words_en text[],
  add column if not exists statement_words_ar text[],
  add column if not exists statement_suffix_en text,
  add column if not exists statement_suffix_ar text;

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- columns may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
