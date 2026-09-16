-- Amna Suraka museum site — defense in depth for the two IP-keyed
-- throttles (0016 admin login, 0035 booking lookup).
--
-- Both key solely on clientIp() (src/lib/clientIp.ts), which reads the
-- first comma-separated value of the x-forwarded-for header. That value is
-- not guaranteed to be trustworthy — a request can arrive with an
-- attacker-chosen value in that position — so an attacker who sends a
-- fresh fake value on every request bypasses both cooldowns entirely:
-- unlimited-rate password guessing against admin_users, and unlimited-rate
-- phone-number enumeration against bookings.
--
-- These two functions add a second throttle keyed on the *identity* being
-- attempted (the email being logged into / the phone being looked up)
-- instead of the caller's claimed IP. An attacker guessing one account's
-- password, or enumerating one phone number, cannot change that identity
-- to dodge this cooldown the way they can spoof an IP — so the two checks
-- together hold even if the IP-based one is fully bypassed. Same
-- check-and-write-atomically-in-a-security-definer-function shape as
-- 0016/0035.

create table if not exists public.admin_login_attempts_by_email (
  email text primary key,
  last_attempt_at timestamptz not null
);

alter table public.admin_login_attempts_by_email enable row level security;

-- No table policies — only ever touched through the function below
-- (security definer). The anon key gets no direct table access.

create or replace function public.check_admin_login_attempt_by_email(p_email text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  cooldown constant interval := interval '60 seconds';
  last_attempt timestamptz;
begin
  select last_attempt_at into last_attempt
  from admin_login_attempts_by_email
  where email = p_email;

  if last_attempt is not null and now() - last_attempt < cooldown then
    return false;
  end if;

  insert into admin_login_attempts_by_email (email, last_attempt_at)
  values (p_email, now())
  on conflict (email) do update set last_attempt_at = excluded.last_attempt_at;

  return true;
end;
$$;

grant execute on function public.check_admin_login_attempt_by_email(text) to anon;

create table if not exists public.booking_lookup_attempts_by_phone (
  phone_key text primary key,
  last_attempt_at timestamptz not null
);

alter table public.booking_lookup_attempts_by_phone enable row level security;

create or replace function public.check_booking_lookup_attempt_by_phone(p_phone_key text)
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
  from booking_lookup_attempts_by_phone
  where phone_key = p_phone_key;

  if last_attempt is not null and now() - last_attempt < cooldown then
    return false;
  end if;

  insert into booking_lookup_attempts_by_phone (phone_key, last_attempt_at)
  values (p_phone_key, now())
  on conflict (phone_key) do update set last_attempt_at = excluded.last_attempt_at;

  return true;
end;
$$;

grant execute on function public.check_booking_lookup_attempt_by_phone(text) to anon;
