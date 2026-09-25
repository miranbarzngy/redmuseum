-- Server-side record of every admin login session, so a session can be
-- ended before its 7-day JWT expires.
--
-- Session tokens used to be purely stateless: signing out only deleted the
-- cookie, so a copied token kept working for up to 7 days, and resetting a
-- user's password didn't sign out anyone already holding their old session.
-- Now each JWT carries this table's id (the "sid" claim) and
-- getAdminSession() (src/lib/adminAuth.ts) requires the row to exist,
-- belong to that user, be unexpired, and not be revoked.
--
--   - signing out revokes that one session;
--   - a password reset/change or deactivation revokes all of that user's
--     sessions.
--
-- Run BEFORE deploying the matching app code. Deploying it signs every
-- admin out once (tokens issued before it carry no sid).

create table if not exists public.admin_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.admin_users (id) on delete cascade,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked_at timestamptz
);

create index if not exists admin_sessions_user_id_idx on public.admin_sessions (user_id);

alter table public.admin_sessions enable row level security;
-- No policies: only the service-role client (admin auth code) touches it.

notify pgrst, 'reload schema';
