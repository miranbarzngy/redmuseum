-- Amna Suraka museum site — fire the notify-new-message Edge Function
-- whenever a visitor submits the Contact form.
--
-- *** You must edit the two placeholders below before running this file ***
--   1. <YOUR_PROJECT_REF>   — from Project Settings > General.
--   2. <YOUR_WEBHOOK_SECRET> — any random string YOU generate, e.g.:
--        node -e "console.log(require('crypto').randomBytes(24).toString('base64url'))"
--      Set the SAME value as the `WEBHOOK_SECRET` secret on the Edge
--      Function (supabase secrets set WEBHOOK_SECRET=...) — the function
--      rejects any request whose header doesn't match it. This is the
--      documented, standard shape of a Supabase Database Webhook trigger;
--      baking the URL and shared secret into the trigger body (rather than
--      the powerful service-role key) is intentional — this function's own
--      job is just "wake up and check for new messages", so it only needs
--      a bearer token the function itself can verify, not full DB access.

create extension if not exists pg_net with schema extensions;

create or replace function public.notify_new_contact_message()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := 'https://<YOUR_PROJECT_REF>.supabase.co/functions/v1/notify-new-message',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-webhook-secret', '<YOUR_WEBHOOK_SECRET>'
    ),
    body := jsonb_build_object('record', row_to_json(new))
  );
  return new;
end;
$$;

create trigger on_contact_message_insert
  after insert on public.contact_messages
  for each row execute function public.notify_new_contact_message();
