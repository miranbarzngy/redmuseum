-- Amna Suraka museum site — self-hosted visitor analytics for the public
-- storefront (not the admin panel, which lives outside [locale] entirely).
-- One row per page view. Country/city come from Vercel's edge geo headers;
-- ip_hash is an HMAC of the visitor's IP (never the raw IP itself) so
-- "unique visitors" can be estimated without storing PII.

create table if not exists public.page_visits (
  id uuid primary key default gen_random_uuid(),
  path text not null,
  country text,
  city text,
  ip_hash text,
  created_at timestamptz not null default now()
);

-- Analytics queries are always "give me visits since some date" — a single
-- index on created_at covers the trend/top-country/top-page aggregations
-- the dashboard runs, all of which filter by date range first.
create index if not exists page_visits_created_at_idx on public.page_visits (created_at desc);

alter table public.page_visits enable row level security;

-- No table policies — like admin_push_tokens/contact_messages, this is only
-- ever touched through the function below (writes) or the service-role
-- client from the already-authenticated admin dashboard (reads). The
-- anon/publishable key gets no direct table access.

create or replace function public.record_page_visit(
  p_path text,
  p_country text default null,
  p_city text default null,
  p_ip_hash text default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into page_visits (path, country, city, ip_hash)
  values (left(coalesce(p_path, '/'), 500), p_country, p_city, p_ip_hash);
end;
$$;

-- The visit-tracking beacon (src/app/api/track-visit/route.ts) runs
-- unauthenticated by nature — it fires on every public page view — so it
-- calls this through the anon-key client. Safe only because the function is
-- security definer and does nothing but insert one row of non-sensitive data.
grant execute on function public.record_page_visit(text, text, text, text) to anon;
