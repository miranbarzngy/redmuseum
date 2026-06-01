-- ============================================================
-- Migration 001: soft-delete for messages + audit_logs table
-- Run this once in your Supabase SQL Editor
-- ============================================================

-- 1. Add archived_at column to messages (soft-delete)
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email  TEXT,
  action      TEXT        NOT NULL,   -- 'delete', 'archive', 'restore', 'status_change', 'create', 'update'
  entity      TEXT        NOT NULL,   -- table name: 'reservations', 'messages', 'users', ...
  entity_id   TEXT,
  details     JSONB       DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- 4. Policy: any authenticated user can insert (needed so client-side logging works)
CREATE POLICY "authenticated_insert" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- 5. Policy: any authenticated user can read (admins see all logs)
CREATE POLICY "authenticated_read" ON audit_logs
  FOR SELECT TO authenticated
  USING (true);

-- 6. Index for fast time-ordered lookups
CREATE INDEX IF NOT EXISTS audit_logs_created_at_idx ON audit_logs (created_at DESC);
