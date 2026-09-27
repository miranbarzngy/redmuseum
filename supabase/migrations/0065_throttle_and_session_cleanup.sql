-- Amna Suraka museum site — stop keeping IP addresses and dead admin rows
-- once they no longer do anything. Companion to 0064, which does the same
-- for the per-phone lookup throttle.
--
-- Never deleted before this:
--   * booking_lookup_attempts (0035) — one row per IP that used "check my
--     booking". Not tied to any booking (it only knows the IP), so there's
--     no visit time to wait for: a row is dead once its 10-second cooldown
--     is over.
--   * admin_login_attempts (0016) — one row per IP that tried the admin
--     login. Dead once its 60-second cooldown is over.
--
-- Only cleaned up while there's traffic, so rows linger through quiet spells:
--   * admin_login_failures (0059) — pruned past 1 day, but only inside
--     admin_login_attempt(), i.e. on the next login attempt.
--   * rate_limit_hits (0060) — pruned past 1 day on ~1% of requests. Its
--     longest window (src/lib/rateLimit.ts) is 1 hour.
--   * admin_sessions (0061) — expired/revoked rows are pruned in
--     createSession(), but only for the user who is logging in. Deleting
--     them is safe: getAdminSession() already rejects a token whose row is
--     missing, same as a revoked or expired one.
--
-- Each cutoff matches the window its own table already uses, so nothing a
-- throttle still needs is removed. Keep them in sync if those change.
--
-- Deliberately left alone: admin_audit_logs (kept on purpose), page_visits
-- (analytics history, stores only an HMAC of the IP), admin_push_tokens
-- (pruned when a push to them fails).
--
-- Runs as a plain SQL pg_cron job — no HTTP call or WEBHOOK_SECRET needed.
-- Prerequisite: pg_cron enabled (already on for 0037/0053).

create or replace function public.cleanup_expired_throttle_rows()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  lookup_ips integer;
  login_ips integer;
  login_failures integer;
  rate_limits integer;
  sessions integer;
begin
  delete from booking_lookup_attempts where last_attempt_at < now() - interval '10 seconds';
  get diagnostics lookup_ips = row_count;

  delete from admin_login_attempts where last_attempt_at < now() - interval '60 seconds';
  get diagnostics login_ips = row_count;

  delete from admin_login_failures where attempted_at < now() - interval '1 day';
  get diagnostics login_failures = row_count;

  delete from rate_limit_hits where window_start < now() - interval '1 day';
  get diagnostics rate_limits = row_count;

  delete from admin_sessions where expires_at < now() or revoked_at is not null;
  get diagnostics sessions = row_count;

  return jsonb_build_object(
    'booking_lookup_attempts', lookup_ips,
    'admin_login_attempts', login_ips,
    'admin_login_failures', login_failures,
    'rate_limit_hits', rate_limits,
    'admin_sessions', sessions
  );
end;
$$;

revoke execute on function public.cleanup_expired_throttle_rows() from public, anon, authenticated;

select cron.schedule(
  'throttle-and-session-cleanup',
  '*/15 * * * *',  -- every 15 minutes, alongside 0064's phone cleanup
  $$ select public.cleanup_expired_throttle_rows(); $$
);

-- Clear the backlog that built up before this job existed; the result shows
-- how many rows each table dropped.
select public.cleanup_expired_throttle_rows();

-- To remove later:  select cron.unschedule('throttle-and-session-cleanup');
