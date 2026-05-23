-- Add visitors/reserve section background color column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS visitors_bg_color TEXT DEFAULT '#0a0a0a';
