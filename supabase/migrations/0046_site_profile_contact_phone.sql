-- Amna Suraka museum site — the new multi-column footer shows a public
-- contact phone number alongside the existing contact_email/contact_location
-- fields (0040). Nullable, same as the rest of that group: NULL means "never
-- edited", and the public footer simply hides the phone row until an admin
-- sets one on /admin/profile.

alter table public.site_profile
  add column if not exists contact_phone text;

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- column may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
