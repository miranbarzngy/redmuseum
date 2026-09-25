-- Generic fixed-window rate limiter for the public, unauthenticated API
-- routes (booking, contact, face-photo upload, visit beacon), which
-- previously accepted unlimited requests — enough to flood the admin
-- inbox / push notifications or fill the face-scans bucket.
--
-- One row per (bucket, key), where bucket names the endpoint and key is
-- usually the caller's IP. The check-and-increment is a single upsert, so
-- concurrent requests can't race past the limit. Called only by the app's
-- service-role client (src/lib/rateLimit.ts); not executable with the
-- public anon key.
--
-- Run BEFORE deploying the matching app code.

create table if not exists public.rate_limit_hits (
  bucket text not null,
  key text not null,
  window_start timestamptz not null,
  hits int not null,
  primary key (bucket, key)
);

create index if not exists rate_limit_hits_window_start_idx on public.rate_limit_hits (window_start);

alter table public.rate_limit_hits enable row level security;
-- No policies: only ever touched through the function below.

create or replace function public.check_rate_limit(
  p_bucket text,
  p_key text,
  p_limit int,
  p_window_seconds int
)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  current_hits int;
begin
  insert into rate_limit_hits as r (bucket, key, window_start, hits)
  values (p_bucket, left(p_key, 200), now(), 1)
  on conflict (bucket, key) do update
    set window_start = case
          when r.window_start < now() - make_interval(secs => p_window_seconds) then now()
          else r.window_start
        end,
        hits = case
          when r.window_start < now() - make_interval(secs => p_window_seconds) then 1
          else r.hits + 1
        end
  returning hits into current_hits;

  -- Opportunistic cleanup, ~1% of calls, so the table never needs a cron.
  if random() < 0.01 then
    delete from rate_limit_hits where window_start < now() - interval '1 day';
  end if;

  return current_hits <= p_limit;
end;
$$;

revoke execute on function public.check_rate_limit(text, text, int, int) from public, anon, authenticated;
grant execute on function public.check_rate_limit(text, text, int, int) to service_role;

notify pgrst, 'reload schema';
