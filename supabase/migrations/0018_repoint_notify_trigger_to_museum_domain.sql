-- Amna Suraka museum site — repoint the new-message notification trigger
-- (see 0015) at the new placeholder production domain now that the site
-- has been rebranded from akoghareeb.vercel.app.
--
-- TODO: amnasuraka.vercel.app is a placeholder — no such Vercel project
-- exists yet. Once the real production deployment is created (or a custom
-- domain is set up), re-run this file with the real URL substituted (same
-- `create or replace function`, safe to run again).
--
-- Before running this in the Supabase SQL editor, replace
-- <YOUR_WEBHOOK_SECRET> below with the real value — the SAME value must
-- also be set as `WEBHOOK_SECRET` on the deployed Next.js app (Vercel
-- project env vars, not NEXT_PUBLIC_). Never commit the real value here —
-- this file is version-controlled in a public repo.

create or replace function public.notify_new_contact_message()
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
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;
