-- Amna Suraka museum site — custom PNG frame overlay for paintings
-- Adds an optional per-painting frame image, uploaded from the admin panel
-- and rendered as an absolutely-positioned overlay on top of the artwork in
-- the public gallery grid (replacing the previous CSS/SVG-only gold frame,
-- which was uniform across every card).

alter table public.paintings
  add column if not exists frame_image_url text;
