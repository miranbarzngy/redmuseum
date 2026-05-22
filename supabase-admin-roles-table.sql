-- Admin roles table
CREATE TABLE IF NOT EXISTS admin_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  description TEXT DEFAULT '',
  permissions JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role full access" ON admin_roles USING (true) WITH CHECK (true);

-- Seed default roles
INSERT INTO admin_roles (name, description, permissions) VALUES
(
  'admin',
  'Full access to everything',
  '{"dashboard":{"view":true,"edit":true,"delete":true},"slides":{"view":true,"edit":true,"delete":true},"gallery":{"view":true,"edit":true,"delete":true},"archive":{"view":true,"edit":true,"delete":true},"exclusive":{"view":true,"edit":true,"delete":true},"visitors":{"view":true,"edit":true,"delete":true},"messages":{"view":true,"edit":true,"delete":true},"about":{"view":true,"edit":true,"delete":true},"activities":{"view":true,"edit":true,"delete":true},"users":{"view":true,"edit":true,"delete":true}}'
),
(
  'editor',
  'Can view and edit, cannot delete or manage users',
  '{"slides":{"view":true,"edit":true,"delete":false},"gallery":{"view":true,"edit":true,"delete":false},"archive":{"view":true,"edit":true,"delete":false},"exclusive":{"view":true,"edit":true,"delete":false},"visitors":{"view":true,"edit":false,"delete":false},"messages":{"view":true,"edit":false,"delete":false},"about":{"view":true,"edit":true,"delete":false},"activities":{"view":true,"edit":true,"delete":false},"users":{"view":false,"edit":false,"delete":false}}'
),
(
  'viewer',
  'Read-only access',
  '{"slides":{"view":true,"edit":false,"delete":false},"gallery":{"view":true,"edit":false,"delete":false},"archive":{"view":true,"edit":false,"delete":false},"exclusive":{"view":true,"edit":false,"delete":false},"visitors":{"view":true,"edit":false,"delete":false},"messages":{"view":true,"edit":false,"delete":false},"about":{"view":true,"edit":false,"delete":false},"activities":{"view":true,"edit":false,"delete":false},"users":{"view":false,"edit":false,"delete":false}}'
)
ON CONFLICT (name) DO NOTHING;
