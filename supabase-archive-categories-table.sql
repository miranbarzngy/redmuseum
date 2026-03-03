-- Archive Categories Table for Supabase
-- Run this SQL in your Supabase SQL Editor to create the archive_categories table

-- Create the archive_categories table
CREATE TABLE IF NOT EXISTS archive_categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name_en TEXT NOT NULL,
  name_ku TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS (Row Level Security)
ALTER TABLE archive_categories ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to archive_categories"
  ON archive_categories FOR SELECT
  TO public
  USING (true);

-- Create policy for authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users to manage archive_categories"
  ON archive_categories FOR ALL
  TO authenticated
  USING (true);

-- Create index for faster ordering queries
CREATE INDEX IF NOT EXISTS idx_archive_categories_order ON archive_categories(display_order ASC);

-- Insert default categories
INSERT INTO archive_categories (name_en, name_ku, slug, display_order) VALUES
('Documents', 'بەڵگەنامەکان', 'documents', 1),
('Letters', 'نامەکان', 'letters', 2),
('Photos', 'وێنە کۆنەکان', 'photos', 3);
