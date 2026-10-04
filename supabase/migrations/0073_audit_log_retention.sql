-- Amna Suraka museum site — admin-chosen retention for admin_audit_logs,
-- and no more visitor details copied into the log when a booking is deleted.
--
-- Until now the audit log was kept forever (0065 left it alone on purpose).
-- The admin now picks how long to keep it on /admin/audit-logs:
--   keep_all — never delete (the default, and what every row had before)
--   1_week   — delete entries older than 7 days
--   1_month  — delete entries older than 1 calendar month
--
-- purge_audit_logs() applies the current choice. It runs daily from pg_cron
-- and straight after an admin changes the setting
-- (src/app/admin/(dashboard)/audit-logs/actions.ts), so picking a shorter
-- period takes effect immediately rather than at the next nightly run.
--
-- audit_log_settings has RLS on and no policies: unlike system_settings
-- (publicly readable for the booking page), nothing outside the admin
-- panel's service-role client needs to see it.
--
-- Idempotent — safe to re-run (cron.schedule replaces a job of the same name).
-- Prerequisite: pg_cron enabled (already on for 0037/0053).

create table if not exists public.audit_log_settings (
  id smallint primary key default 1,
  retention text not null default 'keep_all'
    check (retention in ('keep_all', '1_week', '1_month')),
  updated_at timestamptz not null default now(),
  constraint audit_log_settings_single_row check (id = 1)
);

insert into public.audit_log_settings (id) values (1)
on conflict (id) do nothing;

alter table public.audit_log_settings enable row level security;

create or replace function public.purge_audit_logs()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  cutoff timestamptz;
  deleted integer;
begin
  select case retention
           when '1_week' then now() - interval '7 days'
           when '1_month' then now() - interval '1 month'
         end
    into cutoff
    from audit_log_settings
   where id = 1;

  -- keep_all (or a missing settings row) never deletes anything.
  if cutoff is null then
    return 0;
  end if;

  delete from admin_audit_logs where created_at < cutoff;
  get diagnostics deleted = row_count;
  return deleted;
end;
$$;

revoke execute on function public.purge_audit_logs() from public, anon, authenticated;
grant execute on function public.purge_audit_logs() to service_role;

select cron.schedule(
  'audit-log-retention',
  '0 3 * * *',  -- 03:00 UTC daily
  $$ select public.purge_audit_logs(); $$
);

-- deleteBooking used to snapshot the whole booking row into details.before.
-- It now keeps only non-identifying fields; strip the identifying ones from
-- any entry written before that change.
update public.admin_audit_logs
   set details = jsonb_set(
         details,
         '{before}',
         (details -> 'before') - array['name', 'phone', 'phone_key', 'note', 'public_token', 'face_image_path']
       )
 where action = 'delete_booking'
   and jsonb_typeof(details -> 'before') = 'object';

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- table/function may 404 from the API for up to a minute).
notify pgrst, 'reload schema';

-- To remove later:  select cron.unschedule('audit-log-retention');
