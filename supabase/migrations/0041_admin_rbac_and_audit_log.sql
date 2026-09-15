-- Amna Suraka museum site — multi-user admin accounts with role-based
-- permissions, replacing the single shared ADMIN_PASSWORD, plus an audit
-- trail of admin actions.
--
-- These three tables are at least as sensitive as admin_push_tokens /
-- contact_messages (password hashes, a security audit trail) — same
-- pattern as those: RLS enabled, ZERO policies, no grants to anon or
-- authenticated. Every read/write goes through the service-role client
-- (src/lib/supabase/admin.ts), gated by requireAdminSession(permission)
-- in src/lib/adminAuth.ts. There is nothing here for the anon/publishable
-- key to touch, by design.

-- ============================================================================
-- admin_roles
-- ============================================================================
create table if not exists public.admin_roles (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  permissions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger admin_roles_set_updated_at
  before update on public.admin_roles
  for each row execute function public.set_updated_at();

alter table public.admin_roles enable row level security;

-- ============================================================================
-- admin_users
-- on delete restrict: a role with users still assigned to it can't be
-- deleted out from under them (mirrors gallery.category_id, see
-- 0027_gallery_categories.sql) — reassign or remove those users first.
-- ============================================================================
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  password_hash text not null,
  role_id uuid not null references public.admin_roles (id) on delete restrict,
  is_active boolean not null default true,
  last_login timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists admin_users_role_id_idx on public.admin_users (role_id);

create trigger admin_users_set_updated_at
  before update on public.admin_users
  for each row execute function public.set_updated_at();

alter table public.admin_users enable row level security;

-- ============================================================================
-- admin_audit_logs
-- on delete set null + a denormalized user_email snapshot: deleting an
-- admin account must never delete their history, and the row should still
-- read sensibly afterward.
-- ============================================================================
create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.admin_users (id) on delete set null,
  user_email text not null,
  action text not null,
  target_entity text not null,
  target_id text,
  details jsonb not null default '{}'::jsonb,
  ip_address text,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_at_idx on public.admin_audit_logs (created_at desc);
create index if not exists admin_audit_logs_user_id_idx on public.admin_audit_logs (user_id);
create index if not exists admin_audit_logs_target_entity_idx on public.admin_audit_logs (target_entity);

alter table public.admin_audit_logs enable row level security;

-- ============================================================================
-- Seed — one Super Admin role, full access via the "*" wildcard permission
-- (checked in src/lib/permissions.ts's hasPermission()). No admin_users row
-- is seeded here on purpose — a real or placeholder password has no
-- business in a committed migration file / git history.
-- ============================================================================
insert into public.admin_roles (name, permissions)
values ('سوپەر ئەدمین', '["*"]'::jsonb)
on conflict (name) do nothing;

-- ============================================================================
-- Post-deploy — bootstrapping the first admin account
--
-- Run this by hand in the Supabase SQL editor, once, with your own name /
-- email / password filled in. pgcrypto is already enabled (0001_init.sql),
-- so crypt()/gen_salt('bf') computes a standard bcrypt hash ($2a$/$2b$)
-- server-side — the plaintext password never touches this file or git
-- history, and the resulting hash is directly verifiable later by
-- bcryptjs.compare() in src/lib/adminAuth.ts.
--
--   insert into public.admin_users (full_name, email, password_hash, role_id)
--   values (
--     'Your Name',
--     'you@example.com',
--     crypt('your-password', gen_salt('bf')),
--     (select id from public.admin_roles where name = 'سوپەر ئەدمین')
--   );
--
-- Every subsequent admin_users row should be created from /admin/users
-- (once logged in as the account above) rather than by hand.
-- ============================================================================
