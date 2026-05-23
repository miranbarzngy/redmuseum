-- Add archive section background color column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS archive_bg_color TEXT DEFAULT '#0a0a0a';
