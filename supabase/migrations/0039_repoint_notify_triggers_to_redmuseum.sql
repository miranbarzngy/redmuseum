-- Amna Suraka museum site — repoint BOTH admin-push triggers at the current
-- production domain. The site was rebranded amnasuraka.vercel.app ->
-- redmuseum.vercel.app (capacitor.config.ts already points the APK there),
-- but the DB triggers still net.http_post to the old host, which no longer
-- routes to a running deployment — so new bookings and new contact messages
-- silently stop sending an FCM push to the admin APK.
--
-- This redefines the two trigger *functions* in place; the triggers
-- themselves (on_booking_insert from 0023, on_contact_message_insert from
-- 0014) reference them by name and need no change. Safe to run again.
--
-- Before running this in the Supabase SQL editor, replace
-- <YOUR_WEBHOOK_SECRET> below with the real value — the SAME value that is
-- set as WEBHOOK_SECRET on the deployed Next.js app (Vercel project env
-- vars on the redmuseum.vercel.app project, not NEXT_PUBLIC_). Never commit
-- the real value here — this file is version-controlled in a public repo.

create or replace function public.notify_new_booking()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://redmuseum.vercel.app/api/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object('table', 'bookings', 'record', row_to_json(new))
  );
  return new;
end;
$$;

create or replace function public.notify_new_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://redmuseum.vercel.app/api/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;
