-- Digital Archive Table for Supabase
-- Run this SQL in your Supabase SQL Editor to create the digital_archive table

-- Create the digital_archive table
CREATE TABLE IF NOT EXISTS digital_archive (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title_en TEXT,
  title_ku TEXT,
  description_en TEXT,
  description_ku TEXT,
  category TEXT NOT NULL,
  image_url TEXT,
  file_url TEXT,
  date_created TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS (Row Level Security)
ALTER TABLE digital_archive ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access to digital_archive"
  ON digital_archive FOR SELECT
  TO public
  USING (is_active = true);

-- Create policy for authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated users to manage digital_archive"
  ON digital_archive FOR ALL
  TO authenticated
  USING (true);

-- Create index for faster category queries
CREATE INDEX IF NOT EXISTS idx_digital_archive_category ON digital_archive(category);
CREATE INDEX IF NOT EXISTS idx_digital_archive_date ON digital_archive(date_created DESC);

-- Insert sample data (optional - for testing)
INSERT INTO digital_archive (title_en, title_ku, description_en, description_ku, category, image_url, display_order) VALUES
('Anfal Campaign Document', 'بەڵگەنامەی ئەنفال', 'Historical document from the Anfal campaign', 'بەڵگەنامەیەکی مێژوویی لە کampaینی ئەنفال', 'Documents', '/assets/images/anfal.png', 1),
('Letter from 1960s', 'نامەیەک لە ساڵانی ١٩٦٠', 'Rare letter from the 1960s era', 'نامەیەکی دەگمەن لە سەردەمی ساڵانی ١٩٦٠', 'Letters', '/assets/images/awenakan.png', 2),
('Old Photo Collection', 'کۆمەڵەی وێنە کۆنەکان', 'Collection of rare historical photos', 'کۆمەڵەیەک لە وێنە مێژووییە دەگمەنەکان', 'Photos', '/assets/images/bg-1.jpg', 3);
