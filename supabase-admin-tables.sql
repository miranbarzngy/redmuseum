-- =============================================
-- SUPABASE SQL: Settings & Auth Tables
-- =============================================

-- =============================================
-- STEP 1: Create Settings Table
-- =============================================
CREATE TABLE IF NOT EXISTS settings (
  id BIGSERIAL PRIMARY KEY,
  about_title_en TEXT DEFAULT 'Not To Be Forgotten',
  about_title_kr TEXT DEFAULT 'تا لە یادمان نەچێت',
  about_text_en TEXT,
  about_text_kr TEXT,
  museums_count INTEGER DEFAULT 11,
  archives_count INTEGER DEFAULT 1900,
  visitors_count INTEGER DEFAULT 900,
  contact_phone TEXT DEFAULT '+964 0770 000000',
  contact_email TEXT DEFAULT 'info@amnasuraka.com',
  contact_address_en TEXT DEFAULT 'Sulaymaniyah, Iraq',
  contact_address_kr TEXT DEFAULT 'شاری سلێمانی',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read, admin write
CREATE POLICY "Allow public read settings" ON settings
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Allow authenticated manage settings" ON settings
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default settings
INSERT INTO settings (about_title_en, about_title_kr) VALUES
('Not To Be Forgotten', 'تا لە یادمان نەچێت')
ON CONFLICT DO NOTHING;

-- =============================================
-- STEP 2: Enable Auth
-- =============================================
-- Auth is already enabled by default in Supabase

-- =============================================
-- STEP 3: Create Admin User
-- =============================================
-- Run this in Supabase Dashboard > Authentication > Users
-- Or use the Supabase Admin UI to create a new user

-- Example: Insert a new user (you'll need to set their password in the UI)
-- The admin authentication is handled by Supabase Auth automatically

-- =============================================
-- STEP 4: RLS Policies for Messages Table
-- =============================================
-- Make sure messages table has proper policies

ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert messages" ON messages;
CREATE POLICY "Allow public insert messages" ON messages
  FOR INSERT TO anon WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated read messages" ON messages;
CREATE POLICY "Allow authenticated read messages" ON messages
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated delete messages" ON messages;
CREATE POLICY "Allow authenticated delete messages" ON messages
  FOR DELETE TO authenticated USING (true);

-- =============================================
-- STEP 5: Verify Tables
-- =============================================
-- SELECT * FROM settings;
-- SELECT * FROM messages;
-- SELECT * FROM slides;
