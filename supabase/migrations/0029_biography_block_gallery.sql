-- Amna Suraka museum site — extra photo gallery per museum section.
-- biography_blocks previously carried a single portrait (image_url). This
-- adds an ordered list of additional photos shown on the section's own
-- detail page (/[locale]/museum/[id]). image_url is kept in sync as the
-- first entry (the cover shown in the homepage sections list), same
-- relationship site_profile.hero_image_url has to hero_image_urls.

alter table public.biography_blocks
  add column if not exists image_urls jsonb not null default '[]'::jsonb;

-- Backfill: existing rows with a single portrait become a one-item gallery.
update public.biography_blocks
  set image_urls = jsonb_build_array(image_url)
  where image_url is not null
    and image_urls = '[]'::jsonb;
