-- Amna Suraka museum site — any number of named WhatsApp messages instead
-- of the single booking_settings.whatsapp_accept_template (0066). Managed
-- under /admin/whatsapp (drag to reorder); the bookings board lets the
-- admin pick one per booking, fills in its {name} / {date} / {time} /
-- {guests} / {code} / {link} placeholders and opens it in WhatsApp (wa.me).
-- The first one in sort_order is preselected in that picker.
--
-- Unlike booking_settings this table has no public-read policy: only the
-- admin panel's service-role client ever reads or writes it.
--
-- Safe whether or not 0066 was applied: an existing (non-empty) 0066
-- message is carried over as the first template, otherwise the default
-- acceptance message is seeded.

-- ============================================================================
-- whatsapp_templates
-- ============================================================================
create table if not exists public.whatsapp_templates (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 80),
  body text not null check (char_length(btrim(body)) between 1 and 1000),
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists whatsapp_templates_sort_idx on public.whatsapp_templates (sort_order, created_at);

drop trigger if exists whatsapp_templates_set_updated_at on public.whatsapp_templates;
create trigger whatsapp_templates_set_updated_at
  before update on public.whatsapp_templates
  for each row execute function public.set_updated_at();

alter table public.whatsapp_templates enable row level security;

-- ============================================================================
-- Seed from 0066 (or the default), then drop the old single-message column
-- ============================================================================
do $$
declare
  existing text;
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public'
      and table_name = 'booking_settings'
      and column_name = 'whatsapp_accept_template'
  ) then
    execute 'select whatsapp_accept_template from public.booking_settings where id = 1' into existing;
  end if;

  if not exists (select 1 from public.whatsapp_templates) then
    insert into public.whatsapp_templates (title, body, sort_order)
    values (
      $t$پەسەندکردنی سەردان$t$,
      coalesce(nullif(btrim(existing), ''), $t$سڵاو {name}،
داواکاریی سەردانەکەت بۆ مۆزەخانەی نیشتیمانی ئەمنە سورەکە پەسەند کرا.

بەرواری سەردان: {date}
کاتژمێر: {time}
ژمارەی میوان: {guests}
ژمارەی سەردان: {code}

کۆدی QR ـەکەت لەم لینکەدایە، لە کاتی هاتندا پیشانی بدە:
{link}

چاوەڕوانی سەردانەکەتین.$t$),
      0
    );
  end if;
end $$;

alter table public.booking_settings drop column if exists whatsapp_accept_template;

notify pgrst, 'reload schema';
