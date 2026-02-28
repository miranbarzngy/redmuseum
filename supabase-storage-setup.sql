-- =============================================
-- SUPABASE STORAGE SETUP
-- =============================================

-- Run this in Supabase Dashboard > SQL Editor

-- STEP 1: Create images table for tracking uploads
CREATE TABLE IF NOT EXISTS images (
  id BIGSERIAL PRIMARY KEY,
  filename TEXT NOT NULL,
  path TEXT NOT NULL,
  url TEXT NOT NULL,
  folder TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE images ENABLE ROW LEVEL SECURITY;

-- Policies for images table
CREATE POLICY "Allow public read images" ON images
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated insert images" ON images
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated delete images" ON images
  FOR DELETE TO authenticated USING (true);

-- STEP 2: Create Storage Bucket
-- Go to Supabase Dashboard > Storage > New bucket
-- Name: museum-images
-- Make it public: YES

-- STEP 3: Set Storage Policies
-- Allow public to view images
CREATE POLICY "Allow public read access" ON storage.objects
  FOR SELECT USING (bucket_id = 'museum-images');

-- Allow authenticated users to upload
CREATE POLICY "Allow authenticated upload" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'museum-images' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON storage.objects
  FOR DELETE USING (bucket_id = 'museum-images' AND auth.role() = 'authenticated');
