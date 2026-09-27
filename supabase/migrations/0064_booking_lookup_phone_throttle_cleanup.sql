-- Amna Suraka museum site — stop keeping phone numbers in the per-phone
-- lookup throttle (0043) after the visit they were looked up for is over.
--
-- check_booking_lookup_attempt_by_phone() upserts one row per phone_key and
-- nothing ever deleted them, so booking_lookup_attempts_by_phone kept every
-- looked-up number forever. This removes a row once that number has no
-- visit still ahead of it: no pending/confirmed booking whose visit moment
-- (visit_date + visit_time, museum local time) is in the future. Numbers
-- with no booking at all (typos, enumeration attempts) fall under the same
-- rule and are removed too. A booking without a visit_time counts until the
-- end of its visit_date.
--
-- A row still inside its 10-second cooldown is never touched, so the
-- cleanup can't reset a live throttle. Keep that interval in sync with the
-- cooldown in check_booking_lookup_attempt_by_phone() (0043).
--
-- Runs as a plain SQL pg_cron job — no HTTP call or WEBHOOK_SECRET needed.
-- Prerequisite: pg_cron enabled (already on for 0037/0053).

create or replace function public.cleanup_booking_lookup_attempts_by_phone()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  removed integer;
begin
  delete from booking_lookup_attempts_by_phone a
  where a.last_attempt_at < now() - interval '10 seconds'
    and not exists (
      select 1
      from bookings b
      where b.phone_key = a.phone_key
        and b.status in ('pending', 'confirmed')
        and (
          case
            -- visit_time's check constraint only enforces \d{2}:\d{2}; an
            -- out-of-range value would make the cast throw and fail every
            -- run, so treat it like a missing time instead.
            when b.visit_time ~ '^([01]\d|2[0-3]):[0-5]\d$'
              then (b.visit_date + b.visit_time::time) at time zone 'Asia/Baghdad'
            else (b.visit_date + 1)::timestamp at time zone 'Asia/Baghdad'
          end
        ) > now()
    );

  get diagnostics removed = row_count;
  return removed;
end;
$$;

revoke execute on function public.cleanup_booking_lookup_attempts_by_phone() from public, anon, authenticated;

select cron.schedule(
  'booking-lookup-phone-throttle-cleanup',
  '*/15 * * * *',  -- every 15 minutes, so rows go shortly after the visit slot
  $$ select public.cleanup_booking_lookup_attempts_by_phone(); $$
);

-- Clear the backlog that built up before this job existed.
select public.cleanup_booking_lookup_attempts_by_phone();

-- To remove later:  select cron.unschedule('booking-lookup-phone-throttle-cleanup');
