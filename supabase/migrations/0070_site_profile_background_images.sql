-- Admin-editable list of the faded cut-out pieces that cross-fade in the
-- corners of every public page's background (PaintCanvas.tsx). Uploads go
-- through the profile Server Action into the existing "artwork" bucket,
-- like the hero gallery.
--
-- Null = never saved: the site keeps showing the shipped set in
-- public/images/background (src/lib/backgroundDefaults.ts). An empty array
-- is an explicit "no pieces". Idempotent — safe to re-run.

alter table public.site_profile
  add column if not exists background_image_urls text[];

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- column may still 404 from the API for up to a minute).
notify pgrst, 'reload schema';
