-- Amna Suraka museum site — tie every admin push device to the admin who
-- registered it, so pushes follow that admin's access.
--
-- Until now admin_push_tokens (0013) was a bare list of FCM tokens with no
-- owner. Any signed-in admin, whatever their role, could register a phone,
-- and every push went to every phone: a role without bookings:manage /
-- messages:manage still got visitors' names and message text on its lock
-- screen. Nothing ever removed a phone either, so signing out, being
-- deactivated or having your password reset left it receiving pushes.
--
-- With user_id:
--   * src/lib/adminPush.ts sends a booking push only to phones whose owner
--     is active and whose role holds bookings:manage (messages:manage for a
--     contact message), checked at send time, so a role edit applies to the
--     very next push;
--   * signing out removes that phone's token, and deactivating a user or
--     changing their password removes all of theirs (revokeUserSessions in
--     src/lib/adminAuth.ts);
--   * deleting an admin_users row takes their tokens with it.
--
-- Existing rows can't be attributed to anyone, so they are dropped. Each
-- phone re-registers, now with its owner, the next time the admin app is
-- opened (NativePushBridge registers on every launch) — open the app once on
-- each admin phone after deploying.
--
-- Run this just BEFORE deploying the matching app code. The old code copes
-- with the new column (its phone registration fails silently and pushes
-- pause until the deploy), whereas the new code without the column would
-- fail every push and error out on every password change / deactivation.
-- Idempotent — safe to re-run.

alter table public.admin_push_tokens
  add column if not exists user_id uuid references public.admin_users (id) on delete cascade;

delete from public.admin_push_tokens where user_id is null;

alter table public.admin_push_tokens
  alter column user_id set not null;

create index if not exists admin_push_tokens_user_id_idx on public.admin_push_tokens (user_id);

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- column and its admin_users relationship may 404 from the API for a minute).
notify pgrst, 'reload schema';
