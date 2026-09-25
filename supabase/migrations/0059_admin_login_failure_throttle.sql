-- Replaces the per-email cooldown from 0043 with a failure-counting one.
--
-- 0043's check_admin_login_attempt_by_email() started a 60-second cooldown
-- on *every* attempt for an email, and anon could call it directly — so
-- anyone who knew an admin's email could keep that account permanently
-- locked out just by poking it every ~30 seconds, from anywhere.
--
-- This version:
--   * counts attempts per (email, ip) — a successful login clears that
--     pair's rows, so only failures accumulate;
--   * blocks a pair after 5 failures in 15 minutes — someone guessing from
--     their own IP can't lock the real admin out of theirs;
--   * also blocks an email outright after 100 failures in an hour from any
--     mix of IPs — the backstop against distributed guessing (still far too
--     slow to brute-force an 8+ character password);
--   * is callable by the service role only — the login Server Action calls
--     it through the service-role client, never the public anon key.
--
-- The check-and-record is one atomic function (serialized per email with an
-- advisory lock) so a burst of concurrent requests can't all slip past the
-- limit before any of them is recorded.
--
-- Run BEFORE deploying the matching app code (the login action calls these
-- new functions). The old 0043 function is dropped later, in
-- 0063_lock_down_anon_writes.sql, once the old code is no longer live.

create table if not exists public.admin_login_failures (
  id bigint generated always as identity primary key,
  email text not null,
  ip text not null,
  attempted_at timestamptz not null default now()
);

create index if not exists admin_login_failures_email_idx
  on public.admin_login_failures (email, attempted_at desc);

alter table public.admin_login_failures enable row level security;
-- No policies: only ever touched through the functions below.

create or replace function public.admin_login_attempt(p_email text, p_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  pair_failures int;
  email_failures int;
begin
  perform pg_advisory_xact_lock(hashtext('admin_login:' || p_email));

  select count(*) into pair_failures
  from admin_login_failures
  where email = p_email and ip = p_ip and attempted_at > now() - interval '15 minutes';

  select count(*) into email_failures
  from admin_login_failures
  where email = p_email and attempted_at > now() - interval '1 hour';

  if pair_failures >= 5 or email_failures >= 100 then
    return false;
  end if;

  -- Recorded up front as a failure; admin_login_succeeded() removes it.
  insert into admin_login_failures (email, ip) values (left(p_email, 320), left(p_ip, 100));

  delete from admin_login_failures where attempted_at < now() - interval '1 day';

  return true;
end;
$$;

create or replace function public.admin_login_succeeded(p_email text, p_ip text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from admin_login_failures where email = left(p_email, 320) and ip = left(p_ip, 100);
$$;

revoke execute on function public.admin_login_attempt(text, text) from public, anon, authenticated;
revoke execute on function public.admin_login_succeeded(text, text) from public, anon, authenticated;
grant execute on function public.admin_login_attempt(text, text) to service_role;
grant execute on function public.admin_login_succeeded(text, text) to service_role;

notify pgrst, 'reload schema';
