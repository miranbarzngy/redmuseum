-- Migration: Add category_id foreign key to digital_archive table
-- Run this SQL AFTER running supabase-archive-categories-table.sql

-- First, make the category column nullable to allow migration
ALTER TABLE digital_archive ALTER COLUMN category DROP NOT NULL;

-- Add category_id column to digital_archive table
ALTER TABLE digital_archive ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES archive_categories(id) ON DELETE SET NULL;

-- Create index for faster category_id queries
CREATE INDEX IF NOT EXISTS idx_digital_archive_category_id ON digital_archive(category_id);

-- Migration: Map existing category strings to category_ids
-- This will update existing records to use the foreign key
UPDATE digital_archive
SET category_id = ac.id
FROM archive_categories ac
WHERE 
  (digital_archive.category = 'Documents' AND ac.slug = 'documents') OR
  (digital_archive.category = 'Letters' AND ac.slug = 'letters') OR
  (digital_archive.category = 'Photos' AND ac.slug = 'photos');

-- After migration, you can optionally drop the category column:
-- ALTER TABLE digital_archive DROP COLUMN IF EXISTS category;
