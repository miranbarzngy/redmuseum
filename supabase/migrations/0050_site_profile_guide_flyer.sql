-- Admin-uploadable visitor guide PDF for the Guide Flyer card on both
-- contact surfaces (homepage section + /contact page). Previously that card
-- linked to a static /public asset the admin couldn't replace themselves.
--
-- New "documents" bucket, same public-read / admin-write shape as "artwork"
-- (0001_init.sql) — public read so the download link works for visitors,
-- admin-only write since uploads go through the already-gated profile
-- Server Action using the service-role client (bypasses RLS entirely; these
-- policies are defense-in-depth for any other access path).

alter table public.site_profile
  add column if not exists guide_flyer_url text;

insert into storage.buckets (id, name, public)
values ('documents', 'documents', true)
on conflict (id) do nothing;

create policy "Documents are publicly readable"
  on storage.objects for select
  using (bucket_id = 'documents');

create policy "Admins can upload documents"
  on storage.objects for insert
  with check (bucket_id = 'documents' and public.is_admin());

create policy "Admins can update documents"
  on storage.objects for update
  using (bucket_id = 'documents' and public.is_admin())
  with check (bucket_id = 'documents' and public.is_admin());

create policy "Admins can delete documents"
  on storage.objects for delete
  using (bucket_id = 'documents' and public.is_admin());

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- column may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
