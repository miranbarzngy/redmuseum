-- Amna Suraka museum site — tell which artwork-bucket files nothing uses any
-- more, so the admin panel can delete them.
--
-- Images replaced or removed in the admin panel (gallery, museum sections,
-- homepage hero / background pieces) used to stay in the public artwork
-- bucket forever — still reachable by URL. The admin actions now pass the
-- previous image URLs to removeUnusedArtwork() (src/lib/supabase/uploadImage.ts),
-- which asks this function which of them are no longer referenced and
-- deletes those through the Storage API.
--
-- "Referenced" means the object name appears anywhere in a row of a public
-- table, minus the tables that only ever log or throttle things. In
-- particular admin_audit_logs is skipped: its before/after snapshots name
-- old images, and counting those would keep every file forever. A table
-- added later is scanned automatically, so a new place that stores image
-- URLs keeps its files safe without touching this function — the failure
-- mode is "a file is kept", never "a file in use is deleted".
--
-- security definer (owner: postgres); only the service role may execute it.
-- Idempotent — safe to re-run.

create or replace function public.artwork_unreferenced(p_names text[])
returns setof text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  t record;
  chunk text;
  refs text := '';
begin
  for t in
    select c.relname
      from pg_class c
      join pg_namespace n on n.oid = c.relnamespace
     where n.nspname = 'public'
       and c.relkind in ('r', 'p')
       and c.relname not in (
         'admin_audit_logs', 'page_visits', 'rate_limit_hits', 'admin_sessions',
         'admin_login_attempts', 'admin_login_failures', 'booking_lookup_attempts',
         'booking_lookup_attempts_by_phone', 'admin_push_tokens', 'bookings',
         'contact_messages'
       )
  loop
    execute format('select coalesce(string_agg(x::text, %L), %L) from public.%I x', ' ', '', t.relname)
      into chunk;
    refs := refs || ' ' || chunk;
  end loop;

  return query
    select name
      from unnest(p_names) as name
     where name <> ''
       and position(name in refs) = 0;
end;
$$;

revoke execute on function public.artwork_unreferenced(text[]) from public, anon, authenticated;
grant execute on function public.artwork_unreferenced(text[]) to service_role;

-- Nudge PostgREST to refresh its schema cache immediately (otherwise the new
-- function may 404 from the API for up to a minute).
notify pgrst, 'reload schema';
