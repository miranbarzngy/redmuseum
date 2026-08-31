-- Amna Suraka museum site — each museum section now carries its own short
-- name (e.g. "Exhibition Hall" / "هۆڵی گەلەری"). It's shown as the label in
-- the homepage sections list and as the heading on the section's own detail
-- page (/[locale]/museum/[id]); previously sections had only a body
-- paragraph and were referred to by number ("Section 1", "Section 2", …).

alter table public.biography_blocks
  add column if not exists title_ku text not null default '',
  add column if not exists title_en text not null default '',
  add column if not exists title_ar text not null default '';
