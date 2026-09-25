-- A face photo belongs to exactly one booking. Without this, a booking
-- could be submitted pointing face_image_path at a photo that's already
-- attached to someone else's booking — an admin would then see a stranger's
-- face on it, and the 10-day retention cleanup (0053) would delete the
-- original owner's photo along with it. /api/booking maps the resulting
-- unique violation to a plain 400.
--
-- Safe to run before or after deploying the matching app code.

create unique index if not exists bookings_face_image_path_key
  on public.bookings (face_image_path)
  where face_image_path is not null;
