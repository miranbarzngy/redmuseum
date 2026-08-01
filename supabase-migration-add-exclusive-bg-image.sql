-- Add background image column to exclusive_slides
-- bg_image_url = full-screen background (Layer 1 crossfade)
-- image_url    = featured card image (desktop right column, Layer 2)

ALTER TABLE exclusive_slides
  ADD COLUMN IF NOT EXISTS bg_image_url TEXT;

COMMENT ON COLUMN exclusive_slides.bg_image_url IS
  'Full-screen background image shown behind the hero slider overlay. Falls back to image_url if empty.';

COMMENT ON COLUMN exclusive_slides.image_url IS
  'Featured/card image shown in the right visual column on desktop.';
