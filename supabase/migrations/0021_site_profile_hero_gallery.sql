alter table public.site_profile
  add column if not exists hero_image_urls jsonb not null default '[]'::jsonb;
