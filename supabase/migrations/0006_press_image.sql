-- Amna Suraka museum site — optional thumbnail image for press/media items
-- Adds an image per press item, uploaded from the admin panel and shown on
-- each card in the public Media & Press grid (previously text-only).

alter table public.press_media
  add column if not exists image_url text;
