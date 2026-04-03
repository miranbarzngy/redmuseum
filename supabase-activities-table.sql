-- Create activities table for managing museum events and donations
CREATE TABLE IF NOT EXISTS activities (
  id SERIAL PRIMARY KEY,
  title_ku VARCHAR(255) NOT NULL,
  title_en VARCHAR(255) NOT NULL,
  description_ku TEXT,
  description_en TEXT,
  type VARCHAR(50) DEFAULT 'Event' CHECK (type IN ('Event', 'Donation', 'Other')),
  image_url VARCHAR(500),
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_activities_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_activities_updated_at_trigger ON activities;
CREATE TRIGGER update_activities_updated_at_trigger
  BEFORE UPDATE ON activities
  FOR EACH ROW
  EXECUTE FUNCTION update_activities_updated_at();

-- Enable Row Level Security
ALTER TABLE activities ENABLE ROW LEVEL SECURITY;

-- Create policies for activities table
-- Allow authenticated users to read all activities
CREATE POLICY "Allow authenticated read" ON activities
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Allow service_role to manage all activities (for admin panel)
CREATE POLICY "Allow service_role full access" ON activities
  FOR ALL
  TO service_role
  USING (true);

-- Allow authenticated users to read active activities
CREATE POLICY "Allow authenticated read active" ON activities
  FOR SELECT
  USING (is_active = true);

-- Insert some sample data
INSERT INTO activities (title_ku, title_en, description_ku, description_en, type, image_url, is_active) VALUES
('ڕۆژی مۆزەخانە', 'Museum Day', 'ڕۆژی مۆزەخانە لە ڕۆژی جیهانی مۆزەخانەدا', 'Museum Day celebration on International Museum Day', 'Event', 'https://example.com/museum-day.jpg', true),
('بۆنەی چەندە', 'Charity Event', 'بۆنەی چەندە بۆ یارمەتیدانی خێزانە بێبەرە', 'Charity event to support needy families', 'Donation', 'https://example.com/charity.jpg', false),
('وەرزشی ساڵانە', 'Annual Sports', 'وەرزشی ساڵانەی مۆزەخانە', 'Annual museum sports competition', 'Event', 'https://example.com/sports.jpg', true)
ON CONFLICT DO NOTHING;