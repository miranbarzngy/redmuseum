-- Migration: add user_name column to audit_logs
-- Run this in Supabase SQL Editor

ALTER TABLE audit_logs
  ADD COLUMN IF NOT EXISTS user_name TEXT DEFAULT '';
