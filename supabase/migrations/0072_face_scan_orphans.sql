-- Amna Suraka museum site — find face-scan photos that no booking points at,
-- so the daily cleanup can delete them.
--
-- /api/booking/cleanup-photos (0053) only ever looked at photos a booking
-- still references (bookings.face_image_path), once the visit was 10 days
-- past. Two kinds of photo slipped past it and stayed in the private
-- face-scans bucket indefinitely:
--   * uploads from a booking wizard that was never submitted — the photo is
--     stored by /api/reserve/upload-face before the booking exists;
--   * photos of bookings an admin deleted. deleteBooking now removes the
--     photo itself, but a failed storage call would still leave one behind.
--
-- face_scan_orphans() lists them: objects in face-scans older than
-- p_min_age_hours that no booking references, oldest first. The age margin
-- (24 hours from the route) keeps it well clear of a photo whose visitor is
-- still in the wizard. The route deletes them through the Storage API —
-- deleting storage.objects rows directly would leave the files behind.
--
-- security definer (owner: postgres) so it can read storage.objects; only
-- the service role may execute it, and it returns object names only.
-- Idempotent — safe to re-run.

create or replace function public.face_scan_orphans(p_min_age_hours integer, p_limit integer)
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select o.name
  from storage.objects o
  where o.bucket_id = 'face-scans'
    and o.created_at < now() - make_interval(hours => p_min_age_hours)
    and not exists (
      select 1 from public.bookings b where b.face_image_path = o.name
    )
  order by o.created_at
  limit p_limit;
$$;

revoke execute on function public.face_scan_orphans(integer, integer) from public, anon, authenticated;
grant execute on function public.face_scan_orphans(integer, integer) to service_role;

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- function may 404 from the API for up to a minute).
notify pgrst, 'reload schema';
