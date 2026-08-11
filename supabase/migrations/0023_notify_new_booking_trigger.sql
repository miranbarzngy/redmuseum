-- Amna Suraka museum site — fire the notify-admin push route whenever a
-- visitor submits the Booking form, mirroring 0015/0018's contact_messages
-- trigger. src/app/api/notify-admin/route.ts now branches on the "table"
-- field to build a booking-specific notification instead of a message one.
--
-- Before running this in the Supabase SQL editor, replace
-- <YOUR_WEBHOOK_SECRET> below with the SAME value already set as
-- WEBHOOK_SECRET on the deployed Next.js app (Vercel project env vars, not
-- NEXT_PUBLIC_). Never commit the real value here — this file is
-- version-controlled in a public repo.
--
-- Update the URL below to match whatever the 0018-era contact trigger
-- currently points at (same production domain) when you run this.

create or replace function public.notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://amnasuraka.vercel.app/api/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object('table', 'bookings', 'record', row_to_json(new))
  );
  return new;
end;
$$;

create trigger on_booking_insert
  after insert on public.bookings
  for each row execute function public.notify_new_booking();
