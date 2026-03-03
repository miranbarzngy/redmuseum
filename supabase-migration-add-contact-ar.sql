-- =============================================
-- SUPABASE SQL: Add Arabic contact address to settings table
-- =============================================
-- Run this in your Supabase SQL Editor

-- Add Arabic address column to settings table
ALTER TABLE settings ADD COLUMN IF NOT EXISTS address_ar TEXT;

-- Add sample Arabic address data
UPDATE settings 
SET address_ar = 'السليمانية، العراق'
WHERE address_ar IS NULL;

COMMENT ON COLUMN settings.address_ar IS 'Arabic contact address';

