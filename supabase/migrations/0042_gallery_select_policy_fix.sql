-- The admin gallery pages read through the anon-key client (see
-- src/lib/supabase/server.ts), same as the public site. Every other table's
-- "publicly readable" select policy is unconditional (`using (true)`) and
-- lets application code filter what the public site shows; gallery was the
-- one exception, gating the select itself on `is_active = true`. That meant
-- deactivating an image made it invisible to the admin list/edit pages too
-- (RLS hid the row before the admin could ever see it to flip it back on).
-- getGalleryGroups() in src/lib/data/gallery.ts already filters
-- `is_active = true` for the public site, so the policy no longer needs to.
drop policy "Active gallery images are publicly readable" on public.gallery;

create policy "Gallery images are publicly readable"
  on public.gallery for select
  using (true);
