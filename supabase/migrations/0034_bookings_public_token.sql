-- Amna Suraka museum site — every booking now carries an unguessable
-- public_token. It's the only key used by the visitor-facing status page
-- (/[locale]/booking/<token>, reached by scanning the QR code shown on the
-- booking confirmation screen), so it must NOT be the internal uuid id.
-- 32 hex chars / 122 bits of entropy, from the built-in gen_random_uuid()
-- (no pgcrypto dependency). Existing rows backfill to their own fresh
-- token via the column default.

alter table public.bookings
  add column if not exists public_token text not null
    default replace(gen_random_uuid()::text, '-', '');

create unique index if not exists bookings_public_token_idx
  on public.bookings (public_token);

-- The status page reads a single row by this token through the
-- service-role client (src/lib/supabase/admin.ts) inside a Server
-- Component — same pattern as the admin reads — so no new RLS policy is
-- granted here. The anon key still cannot read bookings at all.
