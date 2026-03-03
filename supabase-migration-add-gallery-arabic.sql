-- =============================================
-- SUPABASE SQL: Add Arabic columns to gallery table
-- =============================================
-- Run this in your Supabase SQL Editor

-- Add Arabic columns to gallery table
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS title_ar TEXT;
ALTER TABLE gallery ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- Add category translations for gallery section
-- The category names in Arabic
COMMENT ON COLUMN gallery.title_ar IS 'Arabic title for the image';
COMMENT ON COLUMN gallery.description_ar IS 'Arabic description for the image';
