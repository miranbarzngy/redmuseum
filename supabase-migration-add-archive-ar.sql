-- =============================================
-- SUPABASE SQL: Add Arabic columns to digital_archive table
-- =============================================
-- Run this in your Supabase SQL Editor

-- Add Arabic title and description columns to digital_archive table
ALTER TABLE digital_archive ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE digital_archive ADD COLUMN IF NOT EXISTS description_ar TEXT;

COMMENT ON COLUMN digital_archive.title_ar IS 'Arabic title for archive items';
COMMENT ON COLUMN digital_archive.description_ar IS 'Arabic description for archive items';
