-- Amna Suraka museum site — rate limit the public "check my booking by
-- phone number" lookup (src/app/api/booking/lookup/route.ts). Phone
-- numbers are a weak identifier, so without a cooldown the endpoint would
-- let anyone enumerate numbers to learn whether each has a booking. Same
-- shape as 0016's admin-login throttle: one row per IP, checked and
-- written atomically inside a security-definer function.

create table if not exists public.booking_lookup_attempts (
  ip text primary key,
  last_attempt_at timestamptz not null
);

alter table public.booking_lookup_attempts enable row level security;

-- No table policies — only ever touched through the function below
-- (security definer). The anon key gets no direct table access.

create or replace function public.check_booking_lookup_attempt(client_ip text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown constant interval := interval '10 seconds';
  last_attempt timestamptz;
begin
  select last_attempt_at into last_attempt
  from booking_lookup_attempts
  where ip = client_ip;

  if last_attempt is not null and now() - last_attempt < cooldown then
    return false;
  end if;

  insert into booking_lookup_attempts (ip, last_attempt_at)
  values (client_ip, now())
  on conflict (ip) do update set last_attempt_at = excluded.last_attempt_at;

  return true;
end;
$$;

-- The lookup form runs unauthenticated, so it calls this through the
-- anon-key client — safe only because the function is security definer and
-- does nothing but rate-limit a single text key.
grant execute on function public.check_booking_lookup_attempt(text) to anon;
