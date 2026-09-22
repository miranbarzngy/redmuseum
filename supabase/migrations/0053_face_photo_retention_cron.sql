-- Amna Suraka museum site — daily cleanup of face-scan photos whose visit
-- happened more than 10 days ago. Calls
-- src/app/api/booking/cleanup-photos/route.ts, which deletes the object
-- from the private face-scans bucket and clears bookings.face_image_path —
-- the booking row itself is kept, only the photo (and its storage cost)
-- goes away.
--
-- Prerequisites (run once in the Supabase dashboard, not version-controlled):
--   - Database → Extensions: pg_cron + pg_net (already enabled for 0037).
--   - Replace <YOUR_WEBHOOK_SECRET> below with the SAME value set as
--     WEBHOOK_SECRET on the deployed Next.js app (redmuseum.vercel.app
--     project — see 0039/0051, the site was rebranded from
--     amnasuraka.vercel.app; 0037's cron predates that rebrand and still
--     points at the stale domain, worth re-pointing too).
--
-- If you'd rather schedule this from Vercel Cron instead, skip this file
-- and add a daily cron hitting /api/booking/cleanup-photos (the route also
-- accepts a Bearer CRON_SECRET).

select cron.schedule(
  'booking-face-photo-retention',
  '30 18 * * *',  -- 18:30 UTC daily; adjust to taste
  $$
  select net.http_post(
    url := 'https://redmuseum.vercel.app/api/booking/cleanup-photos',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := '{}'::jsonb
  );
  $$
);

-- To remove later:  select cron.unschedule('booking-face-photo-retention');
