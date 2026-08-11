-- Amna Suraka museum site — repoint the new-message notification trigger
-- at the Next.js API route (src/app/api/notify-admin/route.ts) instead of
-- the now-removed Supabase Edge Function. One less thing to deploy
-- separately — the notification logic now lives in the same Next.js app
-- as everything else, using firebase-admin instead of hand-rolled JWT
-- signing.
--
-- Points at https://akoghareeb.vercel.app for now — when a custom domain
-- replaces it, just re-run this file with the new URL substituted (same
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
    url := 'https://akoghareeb.vercel.app/api/notify-admin',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;

-- No need to touch the trigger itself — on_contact_message_insert (from
-- 0014) already points at this function by name, so redefining the
-- function body in place is all that's required.
