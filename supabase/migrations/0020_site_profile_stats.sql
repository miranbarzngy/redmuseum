-- Amna Suraka museum site — homepage stat cards (museums, archive items,
-- annual activities, annual visitors) shown flanking the logo emblem.
-- Plain text, not localized like most other fields — these currently render
-- unconditionally in Kurdish regardless of site locale (same as the rest of
-- that section), so one value/label pair per stat is enough.

alter table public.site_profile
  add column if not exists stat_museums_value text,
  add column if not exists stat_museums_label text,
  add column if not exists stat_archive_value text,
  add column if not exists stat_archive_label text,
  add column if not exists stat_activities_value text,
  add column if not exists stat_activities_label text,
  add column if not exists stat_visitors_value text,
  add column if not exists stat_visitors_label text;
