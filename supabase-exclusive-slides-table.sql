-- Create exclusive_slides table
CREATE TABLE IF NOT EXISTS exclusive_slides (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  image_url TEXT,
  title_ku TEXT,
  title_en TEXT,
  title_ar TEXT,
  event_date DATE,
  description_ku TEXT,
  description_en TEXT,
  description_ar TEXT,
  link TEXT,
  phone TEXT,
  phone2 TEXT,
  countdown_to TIMESTAMPTZ,
  is_locked BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE exclusive_slides ENABLE ROW LEVEL SECURITY;

-- Public can read active slides
CREATE POLICY "Public read exclusive_slides" ON exclusive_slides
  FOR SELECT USING (is_active = true);

-- Service role and authenticated users can do everything
CREATE POLICY "Auth manage exclusive_slides" ON exclusive_slides
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Service role manage exclusive_slides" ON exclusive_slides
  FOR ALL TO service_role USING (true) WITH CHECK (true);
