-- Add gallery section background color column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS gallery_bg_color TEXT DEFAULT '#0a0a0a';
