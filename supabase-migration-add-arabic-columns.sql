-- Migration: Add Arabic language columns to digital_archive and archive_categories tables
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- Add Arabic columns to digital_archive table
-- ============================================

-- Add title_ar column
ALTER TABLE digital_archive 
ADD COLUMN IF NOT EXISTS title_ar TEXT;

-- Add description_ar column
ALTER TABLE digital_archive 
ADD COLUMN IF NOT EXISTS description_ar TEXT;

-- ============================================
-- Add Arabic column to archive_categories table
-- ============================================

-- Add name_ar column
ALTER TABLE archive_categories 
ADD COLUMN IF NOT EXISTS name_ar TEXT;

-- ============================================
-- Update RLS policies if needed (should be automatic)
-- ============================================

-- Verify the columns were added (optional check)
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name IN ('digital_archive', 'archive_categories') 
-- AND column_name LIKE '%_ar';

-- Insert sample Arabic category names (optional - for testing)
-- INSERT INTO archive_categories (name_en, name_ku, name_ar, slug, display_order) VALUES
-- ('Documents', 'بەڵگەنامەکان', 'المستندات', 'documents-arabic', 10),
-- ('Letters', 'نامەکان', 'الرسائل', 'letters-arabic', 20),
-- ('Photos', 'وێنە کۆنەکان', 'الصور', 'photos-arabic', 30)
-- ON CONFLICT (slug) DO NOTHING;
