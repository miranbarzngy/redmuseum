-- =============================================
-- FIX RLS POLICIES FOR SLIDES TABLE
-- =============================================

-- Enable RLS if not already enabled
ALTER TABLE slides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read slides" ON slides;
DROP POLICY IF EXISTS "Allow authenticated manage slides" ON slides;

-- Create new policies

-- Policy 1: Allow anyone (anon) to read slides
CREATE POLICY "Allow public read slides" ON slides
  FOR SELECT TO anon USING (true);

-- Policy 2: Allow authenticated users to insert/update/delete
CREATE POLICY "Allow authenticated insert slides" ON slides
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated update slides" ON slides
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated delete slides" ON slides
  FOR DELETE TO authenticated USING (true);

-- Also allow authenticated role to read
CREATE POLICY "Allow authenticated read slides" ON slides
  FOR SELECT TO authenticated USING (true);

-- Verify the table has data
SELECT id, slide_number, title FROM slides;
