-- Amna Suraka museum site — stop keeping scheduled-job history forever, and
-- remove the unused Supabase Auth login from the original admin panel.
--
-- Already applied by hand in the Supabase SQL editor on 2026-10-04; kept
-- here as the record. Safe to re-run (cron.schedule replaces a job of the
-- same name; the deletes find nothing the second time).
--
-- cron.job_run_details: pg_cron writes one row per job run and never prunes
-- it. With two 15-minute jobs (0064/0065) that's ~190 rows a day. Keep the
-- last 7 days, enough to see whether a nightly job ran, and drop the rest
-- every night.
--
-- auth.users: admin login moved to admin_users + admin_sessions in 0041 and
-- nothing calls Supabase Auth any more, but the account created for the
-- first admin panel (2026-08-02, last signed in 2026-08-03) was still there
-- with a live auth session and refresh token. Deleting the user cascades to
-- auth.sessions, auth.refresh_tokens and auth.identities, and to its
-- public.admins row (0001), if any.
--
-- Prerequisite: pg_cron enabled (already on for 0037/0053).

select cron.schedule(
  'cron-history-cleanup',
  '15 3 * * *',  -- 03:15 UTC daily
  $$ delete from cron.job_run_details where end_time < now() - interval '7 days' $$
);

-- Clear the backlog now rather than waiting for the first nightly run.
delete from cron.job_run_details where end_time < now() - interval '7 days';

delete from auth.users where email = 'info@clickgroup.com';

-- To remove later:  select cron.unschedule('cron-history-cleanup');
