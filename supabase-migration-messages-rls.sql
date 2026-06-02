-- Migration: add UPDATE and DELETE RLS policies on messages table
-- Without these, archive / restore / delete from the admin panel silently fail
-- Run this once in Supabase SQL Editor

-- Allow authenticated users (admins) to update messages (e.g. set archived_at)
CREATE POLICY "Allow authenticated update" ON messages
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Allow authenticated users (admins) to permanently delete messages
CREATE POLICY "Allow authenticated delete" ON messages
  FOR DELETE
  TO authenticated
  USING (true);
