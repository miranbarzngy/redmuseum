-- Add museum activities (exclusive) section background color column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS exclusive_bg_color TEXT DEFAULT '#000000';
