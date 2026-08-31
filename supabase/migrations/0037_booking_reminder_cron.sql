-- Amna Suraka museum site — daily reminder that a confirmed booking whose
-- visit date has passed still hasn't been marked hاتووە / نەهاتووە. Calls
-- src/app/api/booking/reminders/route.ts, which counts the overdue rows
-- and pushes a notification to the APK (reusing the same admin_push_tokens
-- fan-out as the new-booking / new-message alerts).
--
-- Prerequisites (run once in the Supabase dashboard, not version-controlled):
--   - Database → Extensions: enable `pg_cron` (pg_net is already on for the
--     0014/0023 notify triggers).
--   - Replace <YOUR_WEBHOOK_SECRET> below with the SAME value set as
--     WEBHOOK_SECRET on the deployed Next.js app.
--   - Point the URL at the same production domain the 0018/0023 triggers use.
--
-- If you'd rather schedule this from Vercel Cron instead, skip this file
-- and add a daily cron hitting /api/booking/reminders (the route also
-- accepts a Bearer CRON_SECRET).

select cron.schedule(
  'booking-visit-reminders',
  '0 18 * * *',  -- 18:00 UTC daily; adjust to taste
  $$
  select net.http_post(
    url := 'https://amnasuraka.vercel.app/api/booking/reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To remove later:  select cron.unschedule('booking-visit-reminders');
