-- Amna Suraka museum site — push notification device registry
-- One row per browser/device that has granted notification permission and
-- registered an FCM token from the admin panel. A device is re-registered
-- (upsert on token) each time it grants permission, so this table doesn't
-- grow unboundedly with duplicates for the same device.

create table if not exists public.admin_push_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  created_at timestamptz not null default now()
);

alter table public.admin_push_tokens enable row level security;

-- Deliberately no policies: like contact_messages, this table is only ever
-- touched server-side via the service-role client (src/app/admin/actions.ts
-- for writes, the notify-new-message Edge Function for reads), gated by
-- requireAdminSession() on the write path. The anon/publishable key gets no
-- access at all.
