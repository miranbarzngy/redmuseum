-- Amna Suraka museum site — switch face scan from a face-api.js descriptor
-- to an actual captured photo, per the new admin-facing spec.
--
-- Photos are real biometric images (not a derived vector like before), so
-- unlike the "artwork" bucket this one is NOT public and gets no anon
-- policies at all. The only way in or out is the service-role client
-- (src/lib/supabase/admin.ts): the public upload-face route uploads with
-- it, and the admin panel reads with it via short-lived signed URLs
-- generated on demand — no long-lived public URL for a visitor's face is
-- ever stored or handed out.
insert into storage.buckets (id, name, public)
values ('face-scans', 'face-scans', false)
on conflict (id) do nothing;

alter table public.bookings
  drop column if exists face_vector_data;

alter table public.bookings
  add column if not exists face_image_path text;
