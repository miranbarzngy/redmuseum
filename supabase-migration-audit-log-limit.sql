-- Migration: keep audit_logs capped at 1000 rows (rolling window)
-- Run this once in Supabase SQL Editor

-- Function: delete oldest rows beyond the 1000-record cap
CREATE OR REPLACE FUNCTION trim_audit_logs()
RETURNS TRIGGER AS $$
BEGIN
  DELETE FROM audit_logs
  WHERE id IN (
    SELECT id FROM audit_logs
    ORDER BY created_at DESC
    OFFSET 1000
  );
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: fires after every insert
DROP TRIGGER IF EXISTS audit_logs_trim ON audit_logs;
CREATE TRIGGER audit_logs_trim
  AFTER INSERT ON audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION trim_audit_logs();
