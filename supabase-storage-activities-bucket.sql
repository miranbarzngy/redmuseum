-- Create activities storage bucket for image uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('activities', 'activities', true)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  public = EXCLUDED.public;

-- Create policies for activities storage bucket
-- Allow authenticated users to read from activities bucket
INSERT INTO storage.objects (bucket_id, name, owner, metadata)
SELECT 'activities', 'placeholder.jpg', NULL, '{"publicURL": "https://bjuxbgoilihbtnifbihv.supabase.co/storage/v1/object/public/activities/placeholder.jpg"}'
WHERE NOT EXISTS (
  SELECT 1 FROM storage.objects 
  WHERE bucket_id = 'activities' AND name = 'placeholder.jpg'
);

-- Create storage policies for activities bucket
-- Allow authenticated users to read all files
CREATE POLICY "Allow authenticated read on activities" ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'activities');

-- Allow service_role to manage all files in activities bucket
CREATE POLICY "Allow service_role full access to activities" ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'activities')
WITH CHECK (bucket_id = 'activities');

-- Allow authenticated users to upload files (for admin use)
CREATE POLICY "Allow authenticated insert on activities" ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'activities');

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated update on activities" ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'activities')
WITH CHECK (bucket_id = 'activities');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated delete on activities" ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'activities');