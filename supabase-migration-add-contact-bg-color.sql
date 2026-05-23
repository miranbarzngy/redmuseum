-- Add contact/messages section background color column to settings
ALTER TABLE settings ADD COLUMN IF NOT EXISTS contact_bg_color TEXT DEFAULT '#0a0f1e';
