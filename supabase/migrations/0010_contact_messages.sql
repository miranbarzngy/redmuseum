-- Amna Suraka museum site — persist contact-form submissions
-- The public Contact section's form previously only console.logged
-- submissions (see the TODO in src/app/api/contact/route.ts) — nothing was
-- ever saved or visible anywhere. This adds a table for it plus a new
-- admin "Messages" inbox to read and manage incoming inquiries.

create table if not exists public.contact_messages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  type text not null check (type in ('commission', 'media', 'other')),
  message text not null,
  is_read boolean not null default false,
  created_at timestamptz not null default now()
);

create index if not exists contact_messages_created_at_idx on public.contact_messages (created_at desc);
create index if not exists contact_messages_is_read_idx on public.contact_messages (is_read);

alter table public.contact_messages enable row level security;

-- This table holds visitor-submitted PII (name, phone, free-text message),
-- not public site content, so unlike every other table in this project it
-- is NOT publicly readable. The only permissive policy is insert — the
-- public Contact form needs to write a new row through the anon/publishable
-- key. Reading, marking as read, and deleting all happen exclusively
-- through the admin panel's service-role client (src/lib/supabase/admin.ts,
-- confined to src/app/admin/**/actions.ts) gated by the admin session check
-- (src/lib/adminAuth.ts) — RLS grants the anon key no select/update/delete
-- access here at all, so that's the only way in.
create policy "Anyone can submit a contact message"
  on public.contact_messages for insert
  with check (true);
