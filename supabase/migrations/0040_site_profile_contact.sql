-- Amna Suraka museum site — make the homepage "Visit & Contact" card
-- (سەردان و پەیوەندی) editable from /admin/profile instead of being frozen in
-- the shipped translation JSON + src/data/socials.ts.
--
--   * contact_email        — the mailto address shown under ئیمەیل
--   * contact_location_*    — the address shown under شوێن, localized like
--                            every other content column (_ku/_en/_ar)
--   * contact_map_url       — optional Google-Maps link; when set, the address
--                            becomes a link
--   * social_*_url          — the four social buttons (Instagram / Facebook /
--                            X / YouTube) in the contact card and the footer
--
-- All nullable: a NULL column means "never edited" and the public site keeps
-- falling back to the shipped default. Every add is `if not exists`, so this
-- is safe to run more than once.

alter table public.site_profile
  add column if not exists contact_email text,
  add column if not exists contact_location_ku text,
  add column if not exists contact_location_en text,
  add column if not exists contact_location_ar text,
  add column if not exists contact_map_url text,
  add column if not exists social_instagram_url text,
  add column if not exists social_facebook_url text,
  add column if not exists social_x_url text,
  add column if not exists social_youtube_url text;

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- columns may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
