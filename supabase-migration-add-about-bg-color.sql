-- Add about section background color column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS about_bg_color TEXT DEFAULT '#ffffff';
