-- Removes every write path the public anon key had into the database.
--
-- The anon ("publishable") key ships to every visitor's browser, so
-- anything granted to it can be called directly against the Supabase REST
-- API, skipping the Next.js routes and all their validation:
--
--   * "Anyone can submit a booking" (0022) was `with check (true)` — a
--     direct insert could set status = 'confirmed' (a self-approved booking
--     whose QR page shows "confirmed" at the door), choose its own
--     public_token, point face_image_path at another visitor's photo, or
--     flood the table (and the admin push notifications) with junk.
--   * "Anyone can submit a contact message" (0010) — same, for the inbox.
--   * The throttle / analytics functions (0016, 0017, 0035, 0043) were
--     executable by anon, so an outsider could drive them directly — e.g.
--     keep an admin's email locked out of login, or spam page_visits.
--
-- The Next.js routes now do all of these writes through the service-role
-- client, after validation and rate limiting, so anon needs none of this.
--
-- RUN THIS AFTER the matching app code is deployed. Before that, the live
-- (old) code still inserts bookings/messages with the anon key and would
-- start failing.

drop policy if exists "Anyone can submit a booking" on public.bookings;
drop policy if exists "Anyone can submit a contact message" on public.contact_messages;

revoke execute on function public.check_admin_login_attempt(text) from public, anon, authenticated;
revoke execute on function public.check_booking_lookup_attempt(text) from public, anon, authenticated;
revoke execute on function public.check_booking_lookup_attempt_by_phone(text) from public, anon, authenticated;
revoke execute on function public.record_page_visit(text, text, text, text) from public, anon, authenticated;

grant execute on function public.check_admin_login_attempt(text) to service_role;
grant execute on function public.check_booking_lookup_attempt(text) to service_role;
grant execute on function public.check_booking_lookup_attempt_by_phone(text) to service_role;
grant execute on function public.record_page_visit(text, text, text, text) to service_role;

-- Superseded by admin_login_attempt() (0059), which counts only failures.
drop function if exists public.check_admin_login_attempt_by_email(text);
drop table if exists public.admin_login_attempts_by_email;

notify pgrst, 'reload schema';
