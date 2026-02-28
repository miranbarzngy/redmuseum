-- =============================================
-- GALLERY TABLE
-- =============================================

-- Create gallery table
CREATE TABLE IF NOT EXISTS gallery (
  id BIGSERIAL PRIMARY KEY,
  category VARCHAR(50) NOT NULL, -- 'visitor', 'activity', 'delegation', 'donation'
  image_url TEXT NOT NULL,
  title TEXT,
  description TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gallery ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Allow public read gallery" ON gallery;
CREATE POLICY "Allow public read gallery" ON gallery
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated insert gallery" ON gallery;
CREATE POLICY "Allow authenticated insert gallery" ON gallery
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated update gallery" ON gallery;
CREATE POLICY "Allow authenticated update gallery" ON gallery
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow authenticated delete gallery" ON gallery;
CREATE POLICY "Allow authenticated delete gallery" ON gallery
  FOR DELETE TO authenticated USING (true);

-- Insert sample images for each category
INSERT INTO gallery (category, image_url, title, display_order, is_active) VALUES
-- Visitor Touring (9 images)
('visitor', '/assets/images/Vistor Touring/1.jpg', 'Visitor 1', 1, true),
('visitor', '/assets/images/Vistor Touring/2.jpg', 'Visitor 2', 2, true),
('visitor', '/assets/images/Vistor Touring/3.jpg', 'Visitor 3', 3, true),
('visitor', '/assets/images/Vistor Touring/4.jpg', 'Visitor 4', 4, true),
('visitor', '/assets/images/Vistor Touring/5.jpg', 'Visitor 5', 5, true),
('visitor', '/assets/images/Vistor Touring/6.jpg', 'Visitor 6', 6, true),
('visitor', '/assets/images/Vistor Touring/7.jpg', 'Visitor 7', 7, true),
('visitor', '/assets/images/Vistor Touring/8.jpg', 'Visitor 8', 8, true),
('visitor', '/assets/images/Vistor Touring/9.jpg', 'Visitor 9', 9, true),
-- Activity (9 images)
('activity', '/assets/images/Activity/1.jpg', 'Activity 1', 1, true),
('activity', '/assets/images/Activity/2.jpg', 'Activity 2', 2, true),
('activity', '/assets/images/Activity/3.jpg', 'Activity 3', 3, true),
('activity', '/assets/images/Activity/4.jpg', 'Activity 4', 4, true),
('activity', '/assets/images/Activity/5.jpg', 'Activity 5', 5, true),
('activity', '/assets/images/Activity/6.jpg', 'Activity 6', 6, true),
('activity', '/assets/images/Activity/7.jpg', 'Activity 7', 7, true),
('activity', '/assets/images/Activity/8.jpg', 'Activity 8', 8, true),
('activity', '/assets/images/Activity/9.jpg', 'Activity 9', 9, true),
-- Official Delegation Visit (20 images)
('delegation', '/assets/images/official delegation visit/1.jpg', 'Delegation 1', 1, true),
('delegation', '/assets/images/official delegation visit/2.jpg', 'Delegation 2', 2, true),
('delegation', '/assets/images/official delegation visit/3.jpg', 'Delegation 3', 3, true),
('delegation', '/assets/images/official delegation visit/4.jpg', 'Delegation 4', 4, true),
('delegation', '/assets/images/official delegation visit/5.jpg', 'Delegation 5', 5, true),
('delegation', '/assets/images/official delegation visit/6.jpg', 'Delegation 6', 6, true),
('delegation', '/assets/images/official delegation visit/7.jpg', 'Delegation 7', 7, true),
('delegation', '/assets/images/official delegation visit/8.jpg', 'Delegation 8', 8, true),
('delegation', '/assets/images/official delegation visit/9.jpg', 'Delegation 9', 9, true),
('delegation', '/assets/images/official delegation visit/11.jpg', 'Delegation 11', 11, true),
('delegation', '/assets/images/official delegation visit/12.jpg', 'Delegation 12', 12, true),
('delegation', '/assets/images/official delegation visit/13.jpg', 'Delegation 13', 13, true),
('delegation', '/assets/images/official delegation visit/14.jpg', 'Delegation 14', 14, true),
('delegation', '/assets/images/official delegation visit/15.jpg', 'Delegation 15', 15, true),
('delegation', '/assets/images/official delegation visit/16.jpg', 'Delegation 16', 16, true),
('delegation', '/assets/images/official delegation visit/17.jpg', 'Delegation 17', 17, true),
('delegation', '/assets/images/official delegation visit/18.jpg', 'Delegation 18', 18, true),
('delegation', '/assets/images/official delegation visit/19.jpg', 'Delegation 19', 19, true),
('delegation', '/assets/images/official delegation visit/20.jpg', 'Delegation 20', 20, true),
-- Donation (8 images)
('donation', '/assets/images/donation/1.jpg', 'Donation 1', 1, true),
('donation', '/assets/images/donation/2.jpg', 'Donation 2', 2, true),
('donation', '/assets/images/donation/3.jpg', 'Donation 3', 3, true),
('donation', '/assets/images/donation/4.jpg', 'Donation 4', 4, true),
('donation', '/assets/images/donation/5.jpg', 'Donation 5', 5, true),
('donation', '/assets/images/donation/6.png', 'Donation 6', 6, true),
('donation', '/assets/images/donation/7.jpg', 'Donation 7', 7, true),
('donation', '/assets/images/donation/8.jpeg', 'Donation 8', 8, true);
