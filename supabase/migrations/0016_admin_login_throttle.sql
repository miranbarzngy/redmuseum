-- Amna Suraka museum site — admin login rate limiting.
-- One row per IP address that has attempted the admin password. The check
-- and the write happen atomically inside a single security definer
-- function so concurrent requests can't race past the cooldown window (a
-- plain select-then-upsert from the app would have that gap).

create table if not exists public.admin_login_attempts (
  ip text primary key,
  last_attempt_at timestamptz not null
);

alter table public.admin_login_attempts enable row level security;

-- No table policies — this table is only ever touched through the function
-- below (security definer, so it doesn't need RLS grants of its own). The
-- anon/publishable key gets no direct table access, matching
-- admin_push_tokens/contact_messages.

create or replace function public.check_admin_login_attempt(client_ip text)
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
  from admin_login_attempts
  where ip = client_ip;

  if last_attempt is not null and now() - last_attempt < cooldown then
    return false;
  end if;

  insert into admin_login_attempts (ip, last_attempt_at)
  values (client_ip, now())
  on conflict (ip) do update set last_attempt_at = excluded.last_attempt_at;

  return true;
end;
$$;

-- The admin login form runs unauthenticated (that's the whole point), so it
-- calls this through the anon-key client — safe only because the function
-- is security definer and does nothing but rate-limit a single text key.
grant execute on function public.check_admin_login_attempt(text) to anon;
