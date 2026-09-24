-- TikTok link alongside the other social columns (0040). NULL = never set;
-- unlike the others there's no shipped default URL, so the button stays
-- hidden until an admin saves one on /admin/profile.

alter table public.site_profile
  add column if not exists social_tiktok_url text;

notify pgrst, 'reload schema';
