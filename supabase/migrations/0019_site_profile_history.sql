-- Amna Suraka museum site — museum history field on the homepage profile
-- Free-text history content (ku/en/ar), editable via /admin/profile.
-- Not wired into any public-facing section yet — admin data entry only.

alter table public.site_profile
  add column if not exists history_ku text,
  add column if not exists history_en text,
  add column if not exists history_ar text;
