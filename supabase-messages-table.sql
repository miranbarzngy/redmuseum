-- =============================================
-- SUPABASE SQL: Messages Table for Contact Form
-- =============================================
-- Run this in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/YOUR_PROJECT/sql

-- =============================================
-- STEP 1: Create the messages table
-- =============================================
CREATE TABLE IF NOT EXISTS messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- STEP 2: Enable Row Level Security (RLS)
-- =============================================
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- =============================================
-- STEP 3: Create RLS Policies
-- =============================================

-- Policy: Allow anyone to submit messages (public insert)
CREATE POLICY "Allow public insert" ON messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Policy: Allow authenticated users to view messages
CREATE POLICY "Allow authenticated select" ON messages
  FOR SELECT
  TO authenticated
  USING (true);

-- =============================================
-- STEP 4: Optional Indexes (for performance)
-- =============================================

-- Index for sorting by date (newest first)
CREATE INDEX IF NOT EXISTS idx_messages_created_at 
ON messages(created_at DESC);

-- =============================================
-- STEP 5: Optional Constraints
-- =============================================

-- Uncomment if you want email validation at database level:
-- ALTER TABLE messages 
-- ADD CONSTRAINT valid_email 
-- CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

-- =============================================
-- TO TEST: Insert a test message
-- =============================================
/*
INSERT INTO messages (name, phone, email, message)
VALUES ('Test User', '+9640770000000', 'test@example.com', 'Test message');
*/
